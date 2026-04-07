import React from "react";
import { registerNotificationSink } from "../services/notificationService";
import { useToast } from "../context/ToastContext";

const NotificationBridge = () => {
  const { showToast } = useToast();

  React.useEffect(() => {
    const unregister = registerNotificationSink((notification) => {
      const message = [notification?.title, notification?.body]
        .filter(Boolean)
        .join(": ");

      if (!message) return;

      const type =
        notification?.priority === "high" || notification?.priority === "urgent"
          ? "error"
          : "success";

      showToast(message, type);
    });

    return unregister;
  }, [showToast]);

  return null;
};

export default NotificationBridge;
