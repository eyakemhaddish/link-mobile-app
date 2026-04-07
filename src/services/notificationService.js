import { getItem, setItem } from "../lib/storage";
import { log, warn } from "../lib/logger";
import { trackEvent } from "../lib/telemetry";

const NOTIFICATION_STATE_KEY = "patient_notification_state_v1";

const sinks = new Set();

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

const emitNotification = (notification) => {
  log("notification", notification);
  trackEvent("patient_notification_emitted", {
    kind: notification.kind,
    dedupeKey: notification.dedupeKey,
    priority: notification.priority,
  });

  sinks.forEach((sink) => {
    try {
      sink(notification);
    } catch (error) {
      warn("Notification sink failed", error?.message || error);
    }
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

export const registerNotificationSink = (sink) => {
  sinks.add(sink);
  return () => {
    sinks.delete(sink);
  };
};

export const notify = (notification) => {
  emitNotification(notification);
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
