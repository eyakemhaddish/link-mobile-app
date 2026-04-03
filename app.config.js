const config = require("./app.json");

module.exports = ({ config: expoConfig }) => ({
  ...expoConfig,
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
