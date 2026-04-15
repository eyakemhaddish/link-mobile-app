import { getItem, setItem } from "../lib/storage";

const STORAGE_KEY = "patient_measurements_v1";

const defaultState = () => ({
  blood_sugar: [],
  blood_pressure: [],
  weight: [],
  other: [],
});

const getState = async () => {
  const stored = await getItem(STORAGE_KEY, null);
  return stored && typeof stored === "object"
    ? {
        ...defaultState(),
        ...stored,
      }
    : defaultState();
};

const persistState = async (state) => {
  await setItem(STORAGE_KEY, state);
};

const toIsoDateTime = (date, time) => {
  const safeDate = String(date || "").trim();
  const safeTime = String(time || "").trim();
  if (!safeDate) return new Date().toISOString();

  const combined = safeTime ? `${safeDate}T${safeTime}:00` : `${safeDate}T08:00:00`;
  const parsed = new Date(combined);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
};

const normalizeEntry = (trackerId, input) => {
  const occurredAt = input?.occurred_at || toIsoDateTime(input?.date, input?.time);
  const base = {
    id: `measurement-${trackerId}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    trackerId,
    occurred_at: occurredAt,
    note: String(input?.note || "").trim(),
    source: input?.source || "manual",
    created_at: new Date().toISOString(),
  };

  switch (trackerId) {
    case "blood_pressure":
      return {
        ...base,
        systolic: Number(input?.systolic || 0) || null,
        diastolic: Number(input?.diastolic || 0) || null,
        pulse: Number(input?.pulse || 0) || null,
      };
    case "blood_sugar":
      return {
        ...base,
        value: Number(input?.value || 0) || null,
        unit: "mg/dL",
      };
    case "weight":
      return {
        ...base,
        value: Number(input?.value || 0) || null,
        unit: "kg",
      };
    case "other":
    default:
      return {
        ...base,
        value: String(input?.value || "").trim(),
        label: String(input?.label || "").trim() || "Other",
      };
  }
};

export const getMeasurementEntries = async (trackerId) => {
  const state = await getState();
  const entries = Array.isArray(state[trackerId]) ? state[trackerId] : [];
  return [...entries].sort((left, right) =>
    String(right?.occurred_at || "").localeCompare(String(left?.occurred_at || "")),
  );
};

export const addMeasurementEntry = async (trackerId, input) => {
  const state = await getState();
  const nextEntry = normalizeEntry(trackerId, input);
  const currentEntries = Array.isArray(state[trackerId]) ? state[trackerId] : [];

  state[trackerId] = [nextEntry, ...currentEntries].sort((left, right) =>
    String(right?.occurred_at || "").localeCompare(String(left?.occurred_at || "")),
  );

  await persistState(state);
  return nextEntry;
};
