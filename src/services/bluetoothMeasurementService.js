const MOCK_SCAN_DELAY_MS = 600;

const MOCK_DEVICES = {
  blood_pressure: [
    {
      id: "mock-bp-cuff-1",
      name: "Mock BP Cuff",
      signal: "Strong",
      manufacturer: "Link Simulator",
      services: ["1810", "180F"],
    },
  ],
  blood_sugar: [
    {
      id: "mock-glucose-meter-1",
      name: "Mock Glucose Meter",
      signal: "Strong",
      manufacturer: "Link Simulator",
      services: ["1808", "180F"],
    },
  ],
};

const wait = (duration) =>
  new Promise((resolve) => {
    setTimeout(resolve, duration);
  });

const randomInRange = (min, max) =>
  Math.round(min + Math.random() * (max - min));

export const getBluetoothRuntimeStatus = () => ({
  scanSupported: false,
  mode: "mock",
  reason:
    "Native BLE scanning is not installed yet in this build. Use the simulated device flow for now.",
});

export const scanMeasurementDevices = async (trackerId) => {
  await wait(MOCK_SCAN_DELAY_MS);

  return {
    runtime: getBluetoothRuntimeStatus(),
    devices: Array.isArray(MOCK_DEVICES[trackerId]) ? MOCK_DEVICES[trackerId] : [],
  };
};

export const connectMeasurementDevice = async (trackerId, deviceId) => {
  const devices = Array.isArray(MOCK_DEVICES[trackerId]) ? MOCK_DEVICES[trackerId] : [];
  const device = devices.find((entry) => entry.id === deviceId);

  if (!device) {
    throw new Error("Selected device is no longer available.");
  }

  await wait(300);
  return {
    ...device,
    connected: true,
    connected_at: new Date().toISOString(),
  };
};

export const buildMeasurementFromDevice = (trackerId, device) => {
  const occurredAt = new Date().toISOString();

  if (trackerId === "blood_pressure") {
    return {
      systolic: randomInRange(112, 134),
      diastolic: randomInRange(72, 86),
      pulse: randomInRange(64, 92),
      note: `Imported from ${device?.name || "Bluetooth device"}`,
      source: "bluetooth_mock",
      occurred_at: occurredAt,
    };
  }

  if (trackerId === "blood_sugar") {
    return {
      value: randomInRange(86, 146),
      note: `Imported from ${device?.name || "Bluetooth device"}`,
      source: "bluetooth_mock",
      occurred_at: occurredAt,
    };
  }

  throw new Error("Bluetooth import is not supported for this measurement yet.");
};
