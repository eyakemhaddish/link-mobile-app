import { getItem, setItem } from "../lib/storage";
import {
  cancelSystemNotifications,
  isSystemNotificationAvailable,
  requestNotificationPermission,
  scheduleDailySystemNotification,
} from "./notificationTransport";

const MEDICATION_REMINDER_STATE_KEY = "medication_reminder_state_v1";

const defaultState = () => ({
  prompts: {},
  schedules: {},
  customSchedules: {},
});

const normalizeMedicationName = (item) =>
  String(
    item?.metadata?.medication_name ||
      item?.metadata?.medicationName ||
      item?.title ||
      "Medication",
  ).trim();

const normalizeOrderId = (item) =>
  String(item?.resource_id || item?.resourceId || item?.id || "").trim();

const getState = async () => {
  const stored = await getItem(MEDICATION_REMINDER_STATE_KEY, null);
  return stored && typeof stored === "object"
    ? {
        prompts: stored.prompts || {},
        schedules: stored.schedules || {},
        customSchedules: stored.customSchedules || {},
      }
    : defaultState();
};

const persistState = async (state) => {
  await setItem(MEDICATION_REMINDER_STATE_KEY, state);
};

const normalizeReminderTitle = (value, fallback = "Reminder") => {
  const normalized = String(value || "").trim();
  return normalized || fallback;
};

const clampDailyDoses = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 3;
  return Math.max(1, Math.min(6, Math.round(numeric)));
};

const normalizeTime = (value) => {
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return {
    hour,
    minute,
    label: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
};

const minutesToTime = (totalMinutes) => {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return {
    hour,
    minute,
    label: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
};

const saveScheduledReminder = async ({
  title,
  body,
  data,
  timesPerDay,
  startTime,
  existingSchedule,
}) => {
  if (!isSystemNotificationAvailable()) {
    throw new Error("Reminders need native notifications on Android or iPhone.");
  }

  const normalizedTimesPerDay = clampDailyDoses(timesPerDay);
  const normalizedStartTime = normalizeTime(startTime)?.label;
  if (!normalizedStartTime) {
    throw new Error("Enter a valid start time.");
  }

  const permission = await requestNotificationPermission();
  if (!permission.granted) {
    throw new Error("Notification permission is required to schedule reminders.");
  }

  const times = buildEquallySpacedMedicationTimes({
    timesPerDay: normalizedTimesPerDay,
    startTime: normalizedStartTime,
  });

  if (existingSchedule?.notificationIds?.length) {
    await cancelSystemNotifications(existingSchedule.notificationIds);
  }

  const notificationIds = [];
  for (const time of times) {
    const notificationId = await scheduleDailySystemNotification({
      title,
      body,
      data: {
        ...(data || {}),
        time: time.label,
      },
      hour: time.hour,
      minute: time.minute,
    });
    if (notificationId) notificationIds.push(notificationId);
  }

  return {
    enabled: true,
    title,
    timesPerDay: normalizedTimesPerDay,
    startTime: normalizedStartTime,
    times,
    notificationIds,
    updatedAt: new Date().toISOString(),
  };
};

export const buildEquallySpacedMedicationTimes = ({
  timesPerDay,
  startTime = "08:00",
}) => {
  const count = clampDailyDoses(timesPerDay);
  const parsedStart = normalizeTime(startTime) || normalizeTime("08:00");
  const baseMinutes = parsedStart.hour * 60 + parsedStart.minute;
  const intervalMinutes = Math.floor(1440 / count);

  return Array.from({ length: count }, (_, index) =>
    minutesToTime(baseMinutes + index * intervalMinutes),
  );
};

export const getMedicationReminderDefaults = (item) => {
  const suggestedCount = clampDailyDoses(
    item?.metadata?.times_per_day ||
      item?.metadata?.timesPerDay ||
      item?.metadata?.doses_per_day ||
      item?.metadata?.dosesPerDay ||
      item?.metadata?.frequency_per_day ||
      item?.metadata?.frequencyPerDay ||
      3,
  );

  return {
    orderId: normalizeOrderId(item),
    medicationName: normalizeMedicationName(item),
    timesPerDay: suggestedCount,
    startTime: "08:00",
    generatedTimes: buildEquallySpacedMedicationTimes({
      timesPerDay: suggestedCount,
      startTime: "08:00",
    }),
  };
};

export const shouldPromptMedicationReminder = async (item) => {
  const resourceType = String(item?.resource_type || "").trim().toLowerCase();
  if (resourceType !== "medication_order") return false;

  const orderId = normalizeOrderId(item);
  if (!orderId) return false;

  const state = await getState();
  const prompt = state.prompts[orderId];
  const latestVersion = String(item?.updated_at || item?.occurred_at || "seen");

  if (state.schedules[orderId]?.enabled) return false;
  if (prompt?.status === "dismissed" && prompt?.version === latestVersion) return false;
  if (prompt?.status === "scheduled" && prompt?.version === latestVersion) return false;

  return true;
};

export const markMedicationReminderDismissed = async (item) => {
  const orderId = normalizeOrderId(item);
  if (!orderId) return;

  const state = await getState();
  state.prompts[orderId] = {
    status: "dismissed",
    version: String(item?.updated_at || item?.occurred_at || "seen"),
  };
  await persistState(state);
};

export const saveMedicationReminderSchedule = async (item, scheduleInput) => {
  const orderId = normalizeOrderId(item);
  if (!orderId) {
    throw new Error("Medication order ID is missing.");
  }

  const state = await getState();
  const existingSchedule = state.schedules[orderId];
  const medicationName = normalizeMedicationName(item);
  const facilityName = String(item?.facility_name || "your facility").trim();
  const schedule = await saveScheduledReminder({
    title: medicationName,
    body: `Time to take ${medicationName}. Scheduled from ${facilityName}.`,
    data: {
      kind: "medication_reminder",
      orderId,
      visitId: item?.visit_id || null,
      medicationName,
    },
    timesPerDay: scheduleInput?.timesPerDay,
    startTime: scheduleInput?.startTime,
    existingSchedule,
  });

  state.schedules[orderId] = {
    ...schedule,
    medicationName,
  };

  state.prompts[orderId] = {
    status: "scheduled",
    version: String(item?.updated_at || item?.occurred_at || "seen"),
  };

  await persistState(state);

  return {
    orderId,
    medicationName,
    timesPerDay: schedule.timesPerDay,
    startTime: schedule.startTime,
    times: schedule.times,
    available: isSystemNotificationAvailable(),
    scheduledCount: schedule.notificationIds.length,
  };
};

export const getMedicationReminderSchedule = async (orderId) => {
  const state = await getState();
  return state.schedules[String(orderId || "").trim()] || null;
};

export const getCustomReminderDefaults = (title = "") => ({
  reminderName: normalizeReminderTitle(title, ""),
  timesPerDay: 1,
  startTime: "08:00",
  generatedTimes: buildEquallySpacedMedicationTimes({
    timesPerDay: 1,
    startTime: "08:00",
  }),
});

export const saveCustomReminderSchedule = async (scheduleInput) => {
  const state = await getState();
  const reminderName = normalizeReminderTitle(scheduleInput?.reminderName, "Reminder");
  const customReminderId =
    String(scheduleInput?.customReminderId || "").trim() ||
    `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const existingSchedule = state.customSchedules[customReminderId];

  const schedule = await saveScheduledReminder({
    title: reminderName,
    body: `Reminder: ${reminderName}.`,
    data: {
      kind: "custom_reminder",
      customReminderId,
      reminderName,
    },
    timesPerDay: scheduleInput?.timesPerDay,
    startTime: scheduleInput?.startTime,
    existingSchedule,
  });

  state.customSchedules[customReminderId] = {
    ...schedule,
    reminderName,
  };
  await persistState(state);

  return {
    customReminderId,
    reminderName,
    timesPerDay: schedule.timesPerDay,
    startTime: schedule.startTime,
    times: schedule.times,
    scheduledCount: schedule.notificationIds.length,
  };
};
