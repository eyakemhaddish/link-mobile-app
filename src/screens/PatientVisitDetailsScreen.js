import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Screen from "../components/ui/Screen";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import MedicationReminderSetupModal from "../components/patient/MedicationReminderSetupModal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { colors, radius, spacing, typography } from "../theme/tokens";
import { patientPortalPalette } from "../theme/patientPortal";
import { getSyncedRecords, getVisitDetails } from "../services/patientService";
import { formatVisitForDisplay, getOrdersSummary } from "../utils/journeyMapper";
import {
  buildEquallySpacedMedicationTimes,
  getMedicationReminderDefaults,
  saveMedicationReminderSchedule,
} from "../services/medicationReminderService";

const ORDER_GROUPS = [
  { key: "lab", title: "Lab orders", empty: "No lab orders" },
  { key: "imaging", title: "Imaging orders", empty: "No imaging orders" },
  { key: "medication", title: "Medication orders", empty: "No medication orders" },
];

const ARTIFACT_LABELS = {
  visit_summary: "Visit Summary",
  prescription: "Prescription",
  lab_result: "Lab Result",
  referral_summary: "Referral Summary",
  imaging: "Imaging",
  vaccination: "Vaccination",
};

const palette = {
  darkPurple: patientPortalPalette.primary,
  lightPurple: patientPortalPalette.primaryFixed,
  green: patientPortalPalette.secondaryFixed,
  white: patientPortalPalette.surface,
  softWhite: patientPortalPalette.background,
  black: patientPortalPalette.text,
  line: "#EDE7FB",
  blueBg: "#DBEAFE",
  blueText: "#1D4ED8",
  successBg: "#DCFCE7",
  successText: "#166534",
  warningBg: "#FEF3C7",
  warningText: "#92400E",
};

const formatDateTime = (value) => {
  if (!value) return "Not available";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const humanize = (value) => {
  if (!value) return "Unknown";
  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
};

const getOrderTitle = (order) =>
  order?.test_name ||
  order?.medication_name ||
  order?.imaging_name ||
  order?.name ||
  order?.order_name ||
  "Order";

const toDisplayText = (value, fallback = "Not recorded") => {
  if (typeof value === "string" || typeof value === "number") {
    const normalized = String(value).trim();
    return normalized || fallback;
  }

  if (value && typeof value === "object") {
    const nested =
      value.name ||
      value.full_name ||
      value.fullName ||
      value.title ||
      value.label ||
      value.description;
    return toDisplayText(nested, fallback);
  }

  return fallback;
};

const getVitalRows = (vitals) => {
  if (!vitals || typeof vitals !== "object") return [];

  const bloodPressure =
    vitals.bp_systolic && vitals.bp_diastolic
      ? `${vitals.bp_systolic}/${vitals.bp_diastolic} mmHg`
      : null;

  return [
    ["Blood pressure", bloodPressure],
    ["Heart rate", vitals.heart_rate ? `${vitals.heart_rate} bpm` : null],
    ["Temperature", vitals.temperature ? `${vitals.temperature} °C` : null],
    ["Oxygen", vitals.spo2_pct ? `${vitals.spo2_pct}%` : null],
    ["Respiratory rate", vitals.respiratory_rate ? `${vitals.respiratory_rate} bpm` : null],
    ["Weight", vitals.weight_kg ? `${vitals.weight_kg} kg` : null],
    ["Height", vitals.height_cm ? `${vitals.height_cm} cm` : null],
  ].filter(([, value]) => Boolean(value));
};

const getStatusStyle = (status) => {
  const raw = String(status || "").toLowerCase();
  if (raw.includes("complete") || raw.includes("dispens") || raw.includes("paid")) {
    return { backgroundColor: palette.successBg, color: palette.successText };
  }
  if (raw.includes("pending") || raw.includes("unpaid")) {
    return { backgroundColor: palette.warningBg, color: palette.warningText };
  }
  return { backgroundColor: palette.blueBg, color: palette.blueText };
};

const areSameName = (left, right) =>
  String(left || "")
    .trim()
    .toLowerCase() ===
  String(right || "")
    .trim()
    .toLowerCase();

const PatientVisitDetailsScreen = ({ route }) => {
  const visitId = route?.params?.visitId;
  const initialVisit = route?.params?.visit || null;
  const initialArtifacts = Array.isArray(route?.params?.artifacts) ? route.params.artifacts : [];
  const isActiveVisit = Boolean(route?.params?.isActiveVisit);

  const [visit, setVisit] = useState(initialVisit);
  const [artifacts, setArtifacts] = useState(initialArtifacts);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMedicationOrder, setSelectedMedicationOrder] = useState(null);
  const [medicationTimesPerDay, setMedicationTimesPerDay] = useState(3);
  const [medicationStartTime, setMedicationStartTime] = useState("08:00");
  const [savingMedicationReminder, setSavingMedicationReminder] = useState(false);
  const [medicationReminderError, setMedicationReminderError] = useState("");
  const { showToast } = useToast();
  const { user } = useAuth();

  const loadData = useCallback(async () => {
    if (!visitId) {
      setError("Visit ID is missing.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError(null);
      const [detailResponse, syncedResponse] = await Promise.all([
        getVisitDetails(visitId),
        getSyncedRecords(120).catch(() => ({ records: [] })),
      ]);

      const resolvedVisit = detailResponse?.visit || initialVisit || null;
      const allArtifacts = Array.isArray(syncedResponse?.records) ? syncedResponse.records : [];

      setVisit(resolvedVisit);
      setArtifacts(allArtifacts.filter((record) => record?.visit_id === visitId));
    } catch (loadError) {
      console.error("Failed to load visit details:", loadError);
      setError(loadError?.message || "Failed to load visit details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [initialVisit, visitId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const formattedVisit = useMemo(
    () => (visit ? formatVisitForDisplay(visit) : null),
    [visit]
  );
  const orderSummary = useMemo(() => getOrdersSummary(visit?.orders), [visit]);
  const vitals = useMemo(() => getVitalRows(visit?.vitals), [visit]);
  const groupedArtifacts = useMemo(() => {
    const groups = {};
    for (const artifact of artifacts) {
      const key = artifact?.document_type || artifact?.record_kind || "other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(artifact);
    }
    return groups;
  }, [artifacts]);
  const generatedMedicationTimes = useMemo(
    () =>
      buildEquallySpacedMedicationTimes({
        timesPerDay: medicationTimesPerDay,
        startTime: medicationStartTime,
      }),
    [medicationStartTime, medicationTimesPerDay],
  );
  const appProfileName = useMemo(
    () =>
      toDisplayText(
        user?.full_name || user?.fullName || user?.name || user?.first_name,
        "",
      ),
    [user],
  );
  const registeredName = useMemo(
    () =>
      toDisplayText(
        visit?.patient?.full_name ||
          visit?.patient?.fullName ||
          visit?.patient?.name ||
          visit?.patient?.first_name,
        "",
      ),
    [visit],
  );
  const showRegisteredName =
    registeredName && (!appProfileName || !areSameName(appProfileName, registeredName));

  const openMedicationReminder = useCallback(
    (order) => {
      const reminderOrder = {
        ...order,
        metadata: {
          medication_name:
            order?.medication_name || order?.name || order?.order_name || getOrderTitle(order),
        },
        facility_name: visit?.facility_name,
        visit_id: visit?.id,
      };
      const defaults = getMedicationReminderDefaults(reminderOrder);

      setSelectedMedicationOrder(reminderOrder);
      setMedicationTimesPerDay(defaults.timesPerDay);
      setMedicationStartTime(defaults.startTime);
      setMedicationReminderError("");
    },
    [visit?.facility_name, visit?.id],
  );

  const closeMedicationReminder = useCallback(() => {
    setSelectedMedicationOrder(null);
    setMedicationReminderError("");
  }, []);

  const saveMedicationReminder = useCallback(async () => {
    if (!selectedMedicationOrder) return;

    try {
      setSavingMedicationReminder(true);
      setMedicationReminderError("");
      const saved = await saveMedicationReminderSchedule(selectedMedicationOrder, {
        timesPerDay: medicationTimesPerDay,
        startTime: medicationStartTime,
      });
      showToast(
        `${saved.medicationName} reminders scheduled for ${saved.times.length} times each day.`,
        "success",
      );
      closeMedicationReminder();
    } catch (saveError) {
      setMedicationReminderError(
        saveError?.message || "Unable to save medication reminders.",
      );
    } finally {
      setSavingMedicationReminder(false);
    }
  }, [
    closeMedicationReminder,
    medicationStartTime,
    medicationTimesPerDay,
    selectedMedicationOrder,
    showToast,
  ]);

  if (loading) {
    return (
      <Screen backgroundColor={palette.white} style={styles.screen} scrollable={false}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={palette.darkPurple} />
          <Text style={styles.loadingText}>Loading visit details...</Text>
        </View>
      </Screen>
    );
  }

  if (error || !visit) {
    return (
      <Screen backgroundColor={palette.white} style={styles.screen} scrollable={false}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error || "Visit details are not available."}</Text>
          <Button title="Retry" onPress={loadData} style={styles.retryButton} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={palette.white} style={styles.screen} scrollable={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.darkPurple} />
        }
      >
        <Card style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>{isActiveVisit ? "Active visit" : "Visit details"}</Text>
              <Text style={styles.heroTitle}>{visit?.facility_name || "Health facility"}</Text>
            </View>
            <View style={styles.heroStatus}>
              <Text style={styles.heroStatusText}>
                {formattedVisit?.currentStage || humanize(visit?.status)}
              </Text>
            </View>
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>Patient</Text>
              <Text style={styles.summaryValue}>{appProfileName || "Patient"}</Text>
            </View>
            {showRegisteredName ? (
              <View style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>Registered name</Text>
                <Text style={styles.summaryValue}>{registeredName}</Text>
              </View>
            ) : null}
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>Provider</Text>
              <Text style={styles.summaryValue}>{formattedVisit?.provider || "Care team"}</Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>Visit date</Text>
              <Text style={styles.summaryValue}>
                {formatDateTime(visit?.visit_date || visit?.date || visit?.created_at)}
              </Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>Chief complaint</Text>
              <Text style={styles.summaryValue}>
                {toDisplayText(visit?.chief_complaint || visit?.reason, "Not recorded")}
              </Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>Last update</Text>
              <Text style={styles.summaryValue}>
                {formattedVisit?.currentStageUpdatedLabel || "Not available"}
              </Text>
            </View>
          </View>

          {visit?.notes ? <Text style={styles.notesText}>{visit.notes}</Text> : null}
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Orders</Text>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryChip, styles.summaryChipSoft]}>
              <Text style={styles.summaryChipValue}>{orderSummary.total}</Text>
              <Text style={styles.summaryChipLabel}>Total</Text>
            </View>
            <View style={[styles.summaryChip, styles.summaryChipSuccess]}>
              <Text style={styles.summaryChipValue}>{orderSummary.completed}</Text>
              <Text style={styles.summaryChipLabel}>Paid</Text>
            </View>
            <View style={[styles.summaryChip, styles.summaryChipWarning]}>
              <Text style={styles.summaryChipValue}>{orderSummary.pending}</Text>
              <Text style={styles.summaryChipLabel}>Pending</Text>
            </View>
          </View>

          {ORDER_GROUPS.map((group) => {
            const items = Array.isArray(visit?.orders?.[group.key]) ? visit.orders[group.key] : [];
            return (
              <View key={group.key} style={styles.groupBlock}>
                <Text style={styles.groupTitle}>{group.title}</Text>
                {items.length === 0 ? (
                  <Text style={styles.emptyText}>{group.empty}</Text>
                ) : (
                  items.map((item) => {
                    const statusStyle = getStatusStyle(item?.status || item?.payment_status);
                    return (
                      <View key={item?.id || `${group.key}-${getOrderTitle(item)}`} style={styles.itemRow}>
                        <View style={styles.itemCopy}>
                          <Text style={styles.itemTitle}>{getOrderTitle(item)}</Text>
                          <Text style={styles.itemMeta}>
                            Status: {humanize(item?.status || "pending")}
                            {item?.payment_status ? `  ·  Payment: ${humanize(item.payment_status)}` : ""}
                          </Text>
                          {group.key === "medication" ? (
                            <Pressable
                              onPress={() => openMedicationReminder(item)}
                              style={styles.orderActionLink}
                            >
                              <Text style={styles.orderActionLinkText}>Set reminder</Text>
                            </Pressable>
                          ) : null}
                        </View>
                        <View style={[styles.itemStatus, { backgroundColor: statusStyle.backgroundColor }]}>
                          <Text style={[styles.itemStatusText, { color: statusStyle.color }]}>
                            {humanize(item?.status || item?.payment_status || "active")}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            );
          })}
        </Card>

        {vitals.length > 0 ? (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Vitals</Text>
            <View style={styles.vitalsGrid}>
              {vitals.map(([label, value]) => (
                <View key={label} style={styles.vitalCard}>
                  <Text style={styles.vitalLabel}>{label}</Text>
                  <Text style={styles.vitalValue}>{value}</Text>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Visit outputs</Text>
          {Object.keys(groupedArtifacts).length === 0 ? (
            <Text style={styles.emptyText}>No visit outputs have been synced for this visit yet.</Text>
          ) : (
            Object.entries(groupedArtifacts).map(([type, items]) => (
              <View key={type} style={styles.groupBlock}>
                <Text style={styles.groupTitle}>{ARTIFACT_LABELS[type] || humanize(type)}</Text>
                {items.map((artifact) => (
                  <View key={artifact.id} style={styles.artifactRow}>
                    <Text style={styles.itemTitle}>
                      {artifact.description || ARTIFACT_LABELS[type] || "Record"}
                    </Text>
                    <Text style={styles.itemMeta}>
                      {artifact.provider_name || "Link visit"}  ·  {artifact.document_date || "Date unavailable"}
                    </Text>
                    {type === "prescription" ? (
                      <Pressable
                        onPress={() =>
                          openMedicationReminder({
                            id: artifact.id,
                            medication_name:
                              artifact.description || ARTIFACT_LABELS[type] || "Prescription",
                          })
                        }
                        style={styles.orderActionLink}
                      >
                        <Text style={styles.orderActionLinkText}>Set reminder</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </View>
            ))
          )}
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Journey</Text>
          {formattedVisit?.journeySteps?.length ? (
            formattedVisit.journeySteps.map((step, index) => (
              <View key={`${step.stage}-${index}`} style={styles.timelineRow}>
                <View style={styles.timelineColumn}>
                  <View
                    style={[
                      styles.timelineDot,
                      step.status === "completed" && styles.timelineDotCompleted,
                      step.status === "active" && styles.timelineDotActive,
                    ]}
                  />
                  {index < formattedVisit.journeySteps.length - 1 ? <View style={styles.timelineLine} /> : null}
                </View>
                <View style={styles.timelineCopy}>
                  <Text style={styles.itemTitle}>{step.label}</Text>
                  <Text style={styles.itemMeta}>{step.time}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No journey timeline is available for this visit.</Text>
          )}
        </Card>
      </ScrollView>
      <MedicationReminderSetupModal
        visible={Boolean(selectedMedicationOrder)}
        title="Schedule your medication"
        subtitle={
          selectedMedicationOrder
            ? `Set reminders for ${visit?.facility_name || "your facility"}.`
            : ""
        }
        reminderName={
          selectedMedicationOrder?.medication_name ||
          selectedMedicationOrder?.name ||
          selectedMedicationOrder?.order_name ||
          "Medication"
        }
        timesPerDay={medicationTimesPerDay}
        startTime={medicationStartTime}
        generatedTimes={generatedMedicationTimes}
        saving={savingMedicationReminder}
        error={medicationReminderError}
        onTimesPerDayChange={setMedicationTimesPerDay}
        onStartTimeChange={setMedicationStartTime}
        onSave={saveMedicationReminder}
        onDismiss={closeMedicationReminder}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: { padding: 0 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl },
  loadingText: { marginTop: spacing.md, ...typography.body, color: palette.darkPurple },
  errorText: { ...typography.body, color: colors.danger, textAlign: "center" },
  retryButton: { marginTop: spacing.md },
  heroCard: { backgroundColor: palette.softWhite, borderColor: palette.lightPurple },
  heroHeader: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md, marginBottom: spacing.md },
  heroCopy: { flex: 1 },
  heroEyebrow: { ...typography.caption, color: palette.darkPurple, fontWeight: "700", textTransform: "uppercase" },
  heroTitle: { ...typography.h2, fontWeight: "700", marginTop: 4 },
  heroStatus: { backgroundColor: palette.lightPurple, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, alignSelf: "flex-start" },
  heroStatusText: { ...typography.caption, color: palette.darkPurple, fontWeight: "700" },
  summaryGrid: { gap: spacing.md },
  summaryCell: { gap: 4 },
  summaryLabel: { ...typography.caption, color: colors.muted, textTransform: "uppercase" },
  summaryValue: { ...typography.body, fontWeight: "600", color: palette.black },
  notesText: { marginTop: spacing.md, ...typography.body, color: palette.black, lineHeight: 20 },
  sectionCard: { marginTop: spacing.md },
  sectionTitle: { ...typography.h3, fontWeight: "700", marginBottom: spacing.md },
  summaryRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  summaryChip: { flex: 1, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: "center" },
  summaryChipSoft: { backgroundColor: palette.softWhite },
  summaryChipSuccess: { backgroundColor: palette.successBg },
  summaryChipWarning: { backgroundColor: palette.warningBg },
  summaryChipValue: { ...typography.h3, fontWeight: "700", color: palette.black },
  summaryChipLabel: { ...typography.caption, color: colors.muted },
  groupBlock: { marginTop: spacing.sm },
  groupTitle: { ...typography.body, fontWeight: "700", marginBottom: spacing.sm },
  itemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: palette.line },
  itemCopy: { flex: 1, gap: 4 },
  itemTitle: { ...typography.body, fontWeight: "600", color: palette.black },
  itemMeta: { ...typography.caption, color: colors.muted },
  orderActionLink: { alignSelf: "flex-start", marginTop: 6 },
  orderActionLinkText: {
    ...typography.caption,
    color: palette.darkPurple,
    fontWeight: "800",
    textDecorationLine: "underline",
  },
  itemStatus: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  itemStatusText: { ...typography.caption, fontWeight: "700" },
  vitalsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  vitalCard: { width: "48%", backgroundColor: palette.softWhite, borderWidth: 1, borderColor: palette.line, borderRadius: radius.md, padding: spacing.sm },
  vitalLabel: { ...typography.caption, color: colors.muted, marginBottom: 4 },
  vitalValue: { ...typography.body, fontWeight: "700", color: palette.black },
  artifactRow: { paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: palette.line },
  timelineRow: { flexDirection: "row", minHeight: 56 },
  timelineColumn: { width: 20, alignItems: "center" },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.border, zIndex: 2 },
  timelineDotCompleted: { backgroundColor: palette.green },
  timelineDotActive: { backgroundColor: palette.darkPurple, borderWidth: 2, borderColor: palette.lightPurple },
  timelineLine: { flex: 1, width: 2, backgroundColor: palette.line, marginVertical: -2 },
  timelineCopy: { flex: 1, marginLeft: spacing.md, paddingBottom: spacing.md },
  emptyText: { ...typography.body, color: colors.muted },
});

export default PatientVisitDetailsScreen;
