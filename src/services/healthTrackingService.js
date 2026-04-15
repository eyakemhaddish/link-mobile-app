export const TRACKABLE_ITEMS = [
  {
    id: "blood_sugar",
    title: "Blood sugar",
    subtitle: "Track daily glucose readings and connect a glucometer by Bluetooth.",
    icon: "droplet",
    accent: "blue",
    supportsBluetooth: true,
    supportsManualEntry: true,
    comingSoon: false,
  },
  {
    id: "blood_pressure",
    title: "Blood pressure",
    subtitle: "Capture pressure readings and pair supported home monitors.",
    icon: "activity",
    accent: "sand",
    supportsBluetooth: true,
    supportsManualEntry: true,
    comingSoon: false,
  },
  {
    id: "weight",
    title: "Weight",
    subtitle: "Log body weight over time or connect a smart scale later.",
    icon: "package",
    accent: "neutral",
    supportsBluetooth: false,
    supportsManualEntry: true,
    comingSoon: false,
  },
  {
    id: "other",
    title: "Other",
    subtitle: "Record other health measurements with date, time, and notes.",
    icon: "edit-3",
    accent: "neutral",
    supportsBluetooth: false,
    supportsManualEntry: true,
    comingSoon: false,
  },
];

export const getTrackableItems = () => TRACKABLE_ITEMS;

export const getTrackableItemById = (trackableId) =>
  TRACKABLE_ITEMS.find((item) => item.id === trackableId) || null;

export const getTrackerActions = (trackableItem) => {
  if (!trackableItem) return [];

  const actions = [];

  if (trackableItem.supportsBluetooth) {
    actions.push({
      id: "connect_bluetooth",
      label: "Connect Bluetooth device",
      description: "Pair a home device and sync future readings automatically.",
      available: true,
    });
  }

  if (trackableItem.supportsManualEntry) {
    actions.push({
      id: "manual_entry",
      label: trackableItem.id === "other" ? "Add manual record" : "Enter reading manually",
      description:
        trackableItem.id === "other"
          ? "Capture a custom measurement with date, time, and notes."
          : "Add a reading by hand when you do not use a connected device.",
      available: true,
    });
  }

  actions.push({
    id: "view_history",
    label: "View trends",
    description: "Open local charts and recent readings for this measurement.",
    available: true,
  });

  return actions;
};

export const getBluetoothConnectionPreset = (trackableItem) => {
  if (!trackableItem?.supportsBluetooth) return null;

  return {
    trackerId: trackableItem.id,
    title: `${trackableItem.title} device connection`,
    steps: [
      "Turn on your Bluetooth device and keep it nearby.",
      "Open nRF Connect and confirm the device advertises over BLE.",
      "Check the device name, services, and readable characteristics in nRF Connect.",
      "Use that information to map the device into Link when app-side BLE scanning is added.",
    ],
    status: "framework_ready",
    scanSupported: false,
    message:
      "Use the simulated device flow now. Native BLE scanning and parser support for real services and characteristics can plug into the same screen next.",
  };
};
