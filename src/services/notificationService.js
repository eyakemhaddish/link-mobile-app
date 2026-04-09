import { getItem, removeItem, setItem } from "../lib/storage";
import { log, warn } from "../lib/logger";
import { trackEvent } from "../lib/telemetry";
import {
  listPatientPushDevices,
  registerPatientPushDevice,
  sendPatientPushTestNotification,
  unregisterPatientPushDevice,
} from "./patientService";
import {
  getSystemPushToken,
  initializeNotificationTransport,
  isSystemNotificationAvailable,
  requestNotificationPermission,
  sendSystemNotification,
} from "./notificationTransport";

const NOTIFICATION_STATE_KEY = "patient_notification_state_v1";
const PUSH_DEVICE_ID_KEY = "patient_push_device_id_v1";
const PUSH_REGISTRATION_KEY = "patient_push_registration_v1";

const defaultState = () => ({
  seenEvents: {},
  visitStages: {},
});

const toDisplayText = (value, fallback = "") => {
  if (typeof value === "string" || typeof value === "number") {
    const normalized = String(value).trim();
    return normalized || fallback;
  }

  if (value && typeof value === "object") {
    return toDisplayText(
      value.name ||
        value.full_name ||
        value.fullName ||
        value.title ||
        value.label ||
        value.description ||
        value.code,
      fallback,
    );
  }

  return fallback;
};

const humanize = (value) =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .trim();

const getNotificationState = async () => {
  const stored = await getItem(NOTIFICATION_STATE_KEY, null);
  return stored && typeof stored === "object"
    ? {
        seenEvents: stored.seenEvents || {},
        visitStages: stored.visitStages || {},
      }
    : defaultState();
};

const persistNotificationState = async (state) => {
  await setItem(NOTIFICATION_STATE_KEY, state);
};

const createLocalDeviceId = () =>
  `device-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

const getOrCreatePushDeviceId = async () => {
  const existing = await getItem(PUSH_DEVICE_ID_KEY, null);
  if (typeof existing === "string" && existing.trim()) return existing.trim();

  const nextDeviceId = createLocalDeviceId();
  await setItem(PUSH_DEVICE_ID_KEY, nextDeviceId);
  return nextDeviceId;
};

const getStoredPushRegistration = async () =>
  (await getItem(PUSH_REGISTRATION_KEY, null)) || null;

const persistPushRegistration = async (registration) => {
  await setItem(PUSH_REGISTRATION_KEY, registration);
};

export const clearStoredPushRegistration = async () => {
  await removeItem(PUSH_REGISTRATION_KEY);
};

const emitNotification = (notification) => {
  log("notification", notification);
  trackEvent("patient_notification_emitted", {
    kind: notification.kind,
    dedupeKey: notification.dedupeKey,
    priority: notification.priority,
  });
  sendSystemNotification(notification).catch((error) => {
    warn("System notification failed", error?.message || error);
  });
};

const buildVisitStageNotification = (item) => {
  const stageLabel = toDisplayText(
    item?.metadata?.current_stage_label,
    humanize(item?.metadata?.current_stage_code || item?.status || "Visit updated"),
  );
  const facilityName = toDisplayText(item?.facility_name, "Your facility");
  const providerName = toDisplayText(item?.metadata?.provider_name, "");

  return {
    kind: "visit_stage_changed",
    priority: item?.priority || "medium",
    dedupeKey: `visit-stage:${item?.visit_id}:${item?.metadata?.current_stage_code}:${item?.updated_at || ""}`,
    title: facilityName,
    body: providerName
      ? `Your visit is now at ${stageLabel} with ${providerName}.`
      : `Your visit is now at ${stageLabel}.`,
    data: item,
  };
};

const buildGenericFeedNotification = (item) => ({
  kind: "patient_feed_update",
  priority: item?.priority || "medium",
  dedupeKey: `feed:${item?.id}:${item?.updated_at || item?.occurred_at || ""}`,
  title: toDisplayText(item?.title, "Update"),
  body: toDisplayText(item?.description, "There is a new update in your patient portal."),
  data: item,
});

export const notify = (notification) => {
  emitNotification(notification);
};

export const initializeNotifications = async () => {
  return initializeNotificationTransport();
};

export const isNotificationPermissionSupported = () =>
  isSystemNotificationAvailable();

export const ensureNotificationPermission = async () => {
  return requestNotificationPermission();
};

export const syncPatientPushRegistration = async ({
  deviceName,
  appVersion,
  buildNumber,
} = {}) => {
  if (!isSystemNotificationAvailable()) {
    return { registered: false, reason: "UNSUPPORTED_PLATFORM" };
  }

  await initializeNotifications();
  const tokenInfo = await getSystemPushToken();
  if (!tokenInfo?.granted || !tokenInfo?.token) {
    return { registered: false, reason: "NO_PUSH_TOKEN", tokenInfo };
  }

  const deviceId = await getOrCreatePushDeviceId();
  const previous = await getStoredPushRegistration();

  if (
    previous?.token === tokenInfo.token &&
    previous?.provider === tokenInfo.provider &&
    previous?.device_id === deviceId
  ) {
    return { registered: true, skipped: true, token: tokenInfo.token, provider: tokenInfo.provider };
  }

  const payload = {
    token: tokenInfo.token,
    provider: tokenInfo.provider,
    platform: tokenInfo.platform,
    device_name: deviceName,
    app_version: appVersion,
    build_number: buildNumber,
    device_id: deviceId,
  };

  const response = await registerPatientPushDevice(payload);
  await persistPushRegistration(payload);

  return {
    registered: true,
    token: tokenInfo.token,
    provider: tokenInfo.provider,
    deviceId,
    raw: response,
  };
};

export const unregisterStoredPatientPushDevice = async () => {
  const registration = await getStoredPushRegistration();
  if (!registration?.device_id && !registration?.token) {
    return { removed: false, reason: "NO_REGISTERED_DEVICE" };
  }

  const response = await unregisterPatientPushDevice({
    device_id: registration?.device_id,
    token: registration?.token,
  });
  await clearStoredPushRegistration();
  return { removed: true, raw: response };
};

export const getRegisteredPatientPushDevices = async () => {
  return listPatientPushDevices();
};

export const triggerPatientPushTestNotification = async (payload = {}) => {
  return sendPatientPushTestNotification(payload);
};

export const processPatientFeedNotifications = async (
  items,
  { emitInitial = false } = {},
) => {
  if (!Array.isArray(items) || !items.length) return;

  const state = await getNotificationState();

  for (const item of items) {
    const resourceType = String(item?.resource_type || "").trim().toLowerCase();
    const itemId = String(item?.id || "").trim();
    const updatedAt = String(item?.updated_at || item?.occurred_at || "").trim();

    if (resourceType === "visit" && item?.visit_id) {
      const visitId = String(item.visit_id);
      const stageCode = String(item?.metadata?.current_stage_code || "").trim().toLowerCase();
      const previousStage = state.visitStages[visitId]?.stageCode || null;

      state.visitStages[visitId] = {
        stageCode,
        updatedAt,
      };

      if (emitInitial && previousStage && stageCode && previousStage !== stageCode) {
        emitNotification(buildVisitStageNotification(item));
      }

      continue;
    }

    if (!itemId) continue;

    const seenVersion = state.seenEvents[itemId];
    state.seenEvents[itemId] = updatedAt || "seen";

    if (!emitInitial) continue;
    if (seenVersion && seenVersion === state.seenEvents[itemId]) continue;

    emitNotification(buildGenericFeedNotification(item));
  }

  await persistNotificationState(state);
};
