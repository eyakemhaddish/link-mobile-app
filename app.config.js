  const appJson = require("./app.json");

  module.exports = () => ({
    ...appJson.expo,
    android: {
      package: "com.link.mobileapp",
      ...(appJson.expo.android ?? {}),
    },
    extra: {
      EXPO_PUBLIC_API_BASE_URL:
        process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:5051/api/v1",
      EXPO_PUBLIC_MEDGEMMA_API_URL:
        process.env.EXPO_PUBLIC_MEDGEMMA_API_URL ||
        "http://localhost:5051/api/v1/ai/analyze",
      EXPO_PUBLIC_PATIENT_TENANT_ID:
        process.env.EXPO_PUBLIC_PATIENT_TENANT_ID || "",
    },
  });