import React from "react";
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Screen from "../components/ui/Screen";
import { useToast } from "../context/ToastContext";
import {
  getBluetoothConnectionPreset,
  getTrackableItemById,
} from "../services/healthTrackingService";
import {
  addMeasurementEntry,
  getMeasurementEntries,
} from "../services/measurementStorageService";
import { patientPortalPalette as palette } from "../theme/patientPortal";
import { radius, shadow, spacing, typography } from "../theme/tokens";

const formatDateTime = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Just now";
  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatShortDay = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";
  return parsed.toLocaleDateString(undefined, { weekday: "short" });
};

const getEntryPrimaryValue = (trackerId, entry) => {
  switch (trackerId) {
    case "blood_pressure":
      return entry?.systolic && entry?.diastolic
        ? `${entry.systolic}/${entry.diastolic}`
        : "--";
    case "blood_sugar":
      return entry?.value ? `${entry.value}` : "--";
    case "weight":
      return entry?.value ? `${entry.value}` : "--";
    case "other":
    default:
      return entry?.value || "--";
  }
};

const getEntryUnit = (trackerId, entry) => {
  switch (trackerId) {
    case "blood_pressure":
      return "mmHg";
    case "blood_sugar":
      return entry?.unit || "mg/dL";
    case "weight":
      return entry?.unit || "kg";
    case "other":
    default:
      return "";
  }
};

const getLatestSummary = (trackerId, entries) => {
  const latest = entries[0] || null;
  if (!latest) {
    return {
      primary: "--",
      unit: "",
      status: "No readings yet",
    };
  }

  if (trackerId === "blood_sugar") {
    const numeric = Number(latest.value || 0);
    const status =
      numeric >= 70 && numeric <= 130 ? "Within target" : numeric > 130 ? "Above target" : "Below target";
    return {
      primary: getEntryPrimaryValue(trackerId, latest),
      unit: getEntryUnit(trackerId, latest),
      status,
    };
  }

  if (trackerId === "blood_pressure") {
    const systolic = Number(latest.systolic || 0);
    const diastolic = Number(latest.diastolic || 0);
    const status =
      systolic <= 120 && diastolic <= 80 ? "Normal range" : "Needs review";
    return {
      primary: getEntryPrimaryValue(trackerId, latest),
      unit: getEntryUnit(trackerId, latest),
      status,
    };
  }

  return {
    primary: getEntryPrimaryValue(trackerId, latest),
    unit: getEntryUnit(trackerId, latest),
    status: "Latest reading",
  };
};

const getBarHeight = (trackerId, entry, maxValue) => {
  if (!entry || !maxValue) return 24;

  let value = 0;
  if (trackerId === "blood_pressure") {
    value = Number(entry?.systolic || 0);
  } else if (trackerId === "other") {
    value = 1;
  } else {
    value = Number(entry?.value || 0);
  }

  const ratio = Math.max(0.18, Math.min(1, value / maxValue));
  return `${Math.round(ratio * 100)}%`;
};

const getChartMax = (trackerId, entries) => {
  if (!entries.length) return 1;
  if (trackerId === "blood_pressure") {
    return Math.max(...entries.map((entry) => Number(entry?.systolic || 0)), 120);
  }
  if (trackerId === "other") return entries.length || 1;
  return Math.max(...entries.map((entry) => Number(entry?.value || 0)), 1);
};

const defaultFormForTracker = (trackerId) => ({
  date: new Date().toISOString().slice(0, 10),
  time: new Date().toTimeString().slice(0, 5),
  note: "",
  value: "",
  label: "",
  systolic: "",
  diastolic: "",
  pulse: "",
});

const MeasurementTrendsScreen = ({ route }) => {
  const trackerId = route?.params?.trackerId || "blood_sugar";
  const initialMode = route?.params?.mode || "history";
  const item = getTrackableItemById(trackerId);
  const bluetoothPreset = getBluetoothConnectionPreset(item);
  const { showToast } = useToast();

  const [entries, setEntries] = React.useState([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [showEntryModal, setShowEntryModal] = React.useState(initialMode === "manual_entry");
  const [form, setForm] = React.useState(defaultFormForTracker(trackerId));

  const loadEntries = React.useCallback(async () => {
    const nextEntries = await getMeasurementEntries(trackerId);
    setEntries(nextEntries);
  }, [trackerId]);

  React.useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  }, [loadEntries]);

  const latestSummary = getLatestSummary(trackerId, entries);
  const chartEntries = entries.slice(0, 7).reverse();
  const chartMax = getChartMax(trackerId, chartEntries);

  const saveEntry = React.useCallback(async () => {
    await addMeasurementEntry(trackerId, form);
    await loadEntries();
    setShowEntryModal(false);
    setForm(defaultFormForTracker(trackerId));
    showToast(`${item?.title || "Measurement"} saved locally.`, "success");
  }, [form, item?.title, loadEntries, showToast, trackerId]);

  const renderManualFields = () => {
    if (trackerId === "blood_pressure") {
      return (
        <>
          <View style={styles.formRow}>
            <View style={styles.formCell}>
              <Text style={styles.fieldLabel}>Systolic</Text>
              <Input
                value={form.systolic}
                onChangeText={(value) => setForm((current) => ({ ...current, systolic: value }))}
                keyboardType="numeric"
                placeholder="120"
              />
            </View>
            <View style={styles.formCell}>
              <Text style={styles.fieldLabel}>Diastolic</Text>
              <Input
                value={form.diastolic}
                onChangeText={(value) => setForm((current) => ({ ...current, diastolic: value }))}
                keyboardType="numeric"
                placeholder="80"
              />
            </View>
          </View>
          <View style={styles.formCell}>
            <Text style={styles.fieldLabel}>Pulse</Text>
            <Input
              value={form.pulse}
              onChangeText={(value) => setForm((current) => ({ ...current, pulse: value }))}
              keyboardType="numeric"
              placeholder="72"
            />
          </View>
        </>
      );
    }

    if (trackerId === "other") {
      return (
        <>
          <View style={styles.formCell}>
            <Text style={styles.fieldLabel}>Measurement name</Text>
            <Input
              value={form.label}
              onChangeText={(value) => setForm((current) => ({ ...current, label: value }))}
              placeholder="Example: Temperature"
            />
          </View>
          <View style={styles.formCell}>
            <Text style={styles.fieldLabel}>Value</Text>
            <Input
              value={form.value}
              onChangeText={(value) => setForm((current) => ({ ...current, value }))}
              placeholder="Example: 37.2 °C"
            />
          </View>
        </>
      );
    }

    return (
      <View style={styles.formCell}>
        <Text style={styles.fieldLabel}>
          {trackerId === "weight" ? "Weight" : "Reading"}
        </Text>
        <Input
          value={form.value}
          onChangeText={(value) => setForm((current) => ({ ...current, value }))}
          keyboardType="decimal-pad"
          placeholder={trackerId === "weight" ? "54" : "94"}
        />
      </View>
    );
  };

  return (
    <Screen backgroundColor={palette.background} style={styles.screen} scrollable={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>{item?.title || "Measurement"}</Text>
            <Text style={styles.headerSubtitle}>Saved on this device with recent logs and simple trends</Text>
          </View>
          <Pressable
            style={styles.entryButton}
            onPress={() => setShowEntryModal(true)}
          >
            <Feather name="plus" size={18} color={palette.textOnDark} />
            <Text style={styles.entryButtonText}>Log reading</Text>
          </Pressable>
        </View>

        {bluetoothPreset ? (
          <Card style={styles.connectCard}>
            <View style={styles.connectCopy}>
              <Text style={styles.connectTitle}>Automatic import</Text>
              <Text style={styles.connectBody}>Sync from your home device when Bluetooth pairing is enabled for this measurement.</Text>
            </View>
            <Button
              title="Connect device"
              onPress={() => showToast("Bluetooth scanning will plug into this page next.", "success")}
              style={styles.connectButton}
            />
          </Card>
        ) : null}

        <Card style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Latest reading</Text>
          <View style={styles.heroValueRow}>
            <Text style={styles.heroValue}>{latestSummary.primary}</Text>
            {latestSummary.unit ? <Text style={styles.heroUnit}>{latestSummary.unit}</Text> : null}
          </View>
          <View style={styles.heroStatusPill}>
            <Text style={styles.heroStatusText}>{latestSummary.status}</Text>
          </View>

          <View style={styles.chartArea}>
            {chartEntries.length ? (
              <>
                <View style={styles.chartBars}>
                  {chartEntries.map((entry) => (
                    <View key={entry.id} style={styles.chartBarColumn}>
                      <View
                        style={[
                          styles.chartBar,
                          { height: getBarHeight(trackerId, entry, chartMax) },
                        ]}
                      />
                    </View>
                  ))}
                </View>
                <View style={styles.chartLabels}>
                  {chartEntries.map((entry) => (
                    <Text key={`${entry.id}-label`} style={styles.chartLabel}>
                      {formatShortDay(entry.occurred_at)}
                    </Text>
                  ))}
                </View>
              </>
            ) : (
              <Text style={styles.emptyChartText}>Your first saved reading will appear here.</Text>
            )}
          </View>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Recent logs</Text>
          {entries.length === 0 ? (
            <Text style={styles.emptyText}>No local readings saved yet.</Text>
          ) : (
            entries.slice(0, 8).map((entry) => (
              <View key={entry.id} style={styles.logRow}>
                <View style={styles.logIconWrap}>
                  <Feather name={item?.icon || "activity"} size={16} color={palette.primary} />
                </View>
                <View style={styles.logCopy}>
                  <Text style={styles.logValue}>
                    {getEntryPrimaryValue(trackerId, entry)} {getEntryUnit(trackerId, entry)}
                  </Text>
                  <Text style={styles.logMeta}>{formatDateTime(entry.occurred_at)}</Text>
                  {entry.note ? <Text style={styles.logNote}>{entry.note}</Text> : null}
                </View>
              </View>
            ))
          )}
        </Card>
      </ScrollView>

      <Modal visible={showEntryModal} animationType="slide" transparent onRequestClose={() => setShowEntryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log {item?.title || "measurement"}</Text>
              <Pressable onPress={() => setShowEntryModal(false)} style={styles.closeButton}>
                <Feather name="x" size={18} color={palette.primary} />
              </Pressable>
            </View>

            <ScrollView>
              {renderManualFields()}

              <View style={styles.formRow}>
                <View style={styles.formCell}>
                  <Text style={styles.fieldLabel}>Date</Text>
                  <Input
                    value={form.date}
                    onChangeText={(value) => setForm((current) => ({ ...current, date: value }))}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
                <View style={styles.formCell}>
                  <Text style={styles.fieldLabel}>Time</Text>
                  <Input
                    value={form.time}
                    onChangeText={(value) => setForm((current) => ({ ...current, time: value }))}
                    placeholder="08:00"
                  />
                </View>
              </View>

              <View style={styles.formCell}>
                <Text style={styles.fieldLabel}>Note</Text>
                <Input
                  value={form.note}
                  onChangeText={(value) => setForm((current) => ({ ...current, note: value }))}
                  placeholder="Optional note"
                  multiline
                  style={styles.noteInput}
                />
              </View>
            </ScrollView>

            <Button title="Save locally" onPress={saveEntry} style={styles.saveButton} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: { padding: 0 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h2,
    color: palette.primary,
  },
  headerSubtitle: {
    ...typography.body,
    color: palette.textMuted,
    marginTop: 4,
  },
  entryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: palette.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  entryButtonText: {
    ...typography.body,
    color: palette.textOnDark,
    fontWeight: "700",
  },
  connectCard: {
    marginBottom: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    alignItems: "center",
    backgroundColor: palette.surfaceLow,
    borderColor: palette.surfaceBorder,
  },
  connectCopy: { flex: 1 },
  connectTitle: {
    ...typography.body,
    color: palette.text,
    fontWeight: "700",
  },
  connectBody: {
    ...typography.caption,
    color: palette.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  connectButton: {
    paddingHorizontal: spacing.md,
  },
  heroCard: {
    marginBottom: spacing.md,
    backgroundColor: palette.surfaceLowest,
    borderColor: palette.surfaceBorder,
    ...shadow.card,
  },
  heroEyebrow: {
    ...typography.caption,
    color: palette.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginTop: spacing.sm,
  },
  heroValue: {
    fontSize: 42,
    fontWeight: "800",
    color: palette.primary,
  },
  heroUnit: {
    ...typography.body,
    color: palette.textMuted,
    fontWeight: "700",
  },
  heroStatusPill: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    backgroundColor: palette.secondaryFixed,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroStatusText: {
    ...typography.caption,
    color: palette.secondary,
    fontWeight: "700",
  },
  chartArea: {
    marginTop: spacing.lg,
    minHeight: 210,
    justifyContent: "flex-end",
  },
  chartBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    height: 150,
  },
  chartBarColumn: {
    flex: 1,
    justifyContent: "flex-end",
  },
  chartBar: {
    width: "100%",
    backgroundColor: palette.primaryContainer,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    minHeight: 18,
  },
  chartLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chartLabel: {
    flex: 1,
    textAlign: "center",
    ...typography.caption,
    color: palette.textMuted,
    fontWeight: "700",
  },
  emptyChartText: {
    ...typography.body,
    color: palette.textMuted,
  },
  summaryCard: {
    backgroundColor: palette.surfaceLowest,
    borderColor: palette.surfaceBorder,
  },
  sectionTitle: {
    ...typography.h3,
    color: palette.text,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: palette.textMuted,
  },
  logRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.surfaceBorder,
  },
  logIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: palette.primaryFixed,
    alignItems: "center",
    justifyContent: "center",
  },
  logCopy: {
    flex: 1,
    gap: 2,
  },
  logValue: {
    ...typography.body,
    color: palette.text,
    fontWeight: "700",
  },
  logMeta: {
    ...typography.caption,
    color: palette.textMuted,
  },
  logNote: {
    ...typography.caption,
    color: palette.text,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.35)",
  },
  modalContent: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: "86%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h3,
    color: palette.text,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.primaryFixed,
    alignItems: "center",
    justifyContent: "center",
  },
  formRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  formCell: {
    flex: 1,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.caption,
    color: palette.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  noteInput: {
    minHeight: 92,
    textAlignVertical: "top",
  },
  saveButton: {
    marginTop: spacing.sm,
  },
});

export default MeasurementTrendsScreen;
