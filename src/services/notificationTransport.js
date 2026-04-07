import { Platform } from "react-native";
import { log, warn } from "../lib/logger";

let Notifications = null;
if (Platform.OS !== "web") {
  try {
    Notifications = require("expo-notifications");
  } catch (error) {
    warn("expo-notifications is not installed yet.", error?.message || error);
  }
}

let configured = false;

const getNotificationsModule = () => Notifications;

export const isSystemNotificationAvailable = () =>
  Platform.OS !== "web" && Boolean(getNotificationsModule());

export const initializeNotificationTransport = async () => {
  const module = getNotificationsModule();
  if (!module || configured) return Boolean(module);

  module.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === "android") {
    await module.setNotificationChannelAsync("patient-updates", {
      name: "Patient updates",
      importance: module.AndroidImportance?.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#005A9E",
    });
  }

  configured = true;
  return true;
};

export const requestNotificationPermission = async () => {
  const module = getNotificationsModule();
  if (!module) return { granted: false, available: false };

  await initializeNotificationTransport();

  const existing = await module.getPermissionsAsync();
  if (existing.granted || existing.ios?.status === module.IosAuthorizationStatus?.PROVISIONAL) {
    return { granted: true, available: true, status: existing.status };
  }

  const requested = await module.requestPermissionsAsync();
  const granted =
    requested.granted ||
    requested.ios?.status === module.IosAuthorizationStatus?.PROVISIONAL;

  return {
    granted,
    available: true,
    status: requested.status,
  };
};

export const sendSystemNotification = async (notification) => {
  const module = getNotificationsModule();
  if (!module) {
    warn("Skipping system notification; expo-notifications unavailable.");
    return false;
  }

  const permission = await requestNotificationPermission();
  if (!permission.granted) {
    warn("Skipping system notification; permission not granted.");
    return false;
  }

  await module.scheduleNotificationAsync({
    content: {
      title: notification?.title || "Patient update",
      body: notification?.body || "There is a new update in your patient portal.",
      data: notification?.data || {},
      sound: true,
    },
    trigger: null,
  });

  log("system_notification_scheduled", notification?.kind, notification?.dedupeKey);
  return true;
};

export const cancelSystemNotifications = async (notificationIds = []) => {
  const module = getNotificationsModule();
  if (!module || !Array.isArray(notificationIds) || !notificationIds.length) {
    return false;
  }

  await Promise.all(
    notificationIds
      .filter(Boolean)
      .map((notificationId) => module.cancelScheduledNotificationAsync(notificationId).catch(() => null)),
  );

  return true;
};

export const scheduleDailySystemNotification = async ({
  title,
  body,
  data,
  hour,
  minute,
}) => {
  const module = getNotificationsModule();
  if (!module) {
    warn("Skipping scheduled notification; expo-notifications unavailable.");
    return null;
  }

  const permission = await requestNotificationPermission();
  if (!permission.granted) {
    warn("Skipping scheduled notification; permission not granted.");
    return null;
  }

  const notificationId = await module.scheduleNotificationAsync({
    content: {
      title: title || "Medication reminder",
      body: body || "It is time to take your medication.",
      data: data || {},
      sound: true,
    },
    trigger: {
      type: module.SchedulableTriggerInputTypes?.DAILY,
      hour,
      minute,
    },
  });

  log("daily_system_notification_scheduled", notificationId, hour, minute);
  return notificationId;
};
