import React from "react";
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Screen from "../components/ui/Screen";
import { getFamilyData } from "../services/patientService";
import { patientPortalPalette as palette } from "../theme/patientPortal";
import { colors, radius, spacing, typography } from "../theme/tokens";

const FAMILY_PAGE_LIMIT = 25;

const titleize = (value) =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());

const formatDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const parsePayload = (value) => {
  if (!value) return {};
  if (typeof value === "object") return value;
  if (typeof value !== "string") return {};

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const getPayloadEntries = (payload) =>
  Object.entries(payload || {})
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .slice(0, 6);

const getScopeIcon = (scope) => {
  const normalized = String(scope || "").toLowerCase();
  if (normalized.includes("lab")) return "activity";
  if (normalized.includes("prescription") || normalized.includes("medication")) return "package";
  if (normalized.includes("billing")) return "credit-card";
  return "file-text";
};

const PatientInitials = ({ name }) => {
  const initials = String(name || "Family")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <View style={styles.initials}>
      <Text style={styles.initialsText}>{initials || "F"}</Text>
    </View>
  );
};

const ScopeChip = ({ scope }) => (
  <View style={styles.scopeChip}>
    <Feather name={getScopeIcon(scope)} size={13} color={palette.primary} />
    <Text style={styles.scopeText}>{titleize(scope)}</Text>
  </View>
);

const PolicyRow = ({ icon, label, value }) => (
  <View style={styles.policyRow}>
    <Feather name={icon} size={15} color={palette.textMuted} />
    <Text style={styles.policyLabel}>{label}</Text>
    <Text style={styles.policyValue}>{value}</Text>
  </View>
);

const SnapshotCard = ({ snapshot }) => {
  const payload = parsePayload(snapshot?.payload_json || snapshot?.payloadJson || snapshot?.payload);
  const entries = getPayloadEntries(payload);
  const periodStart = formatDate(snapshot?.period_start || snapshot?.periodStart);
  const periodEnd = formatDate(snapshot?.period_end || snapshot?.periodEnd);

  return (
    <View style={styles.snapshotCard}>
      <View style={styles.snapshotHeader}>
        <View>
          <Text style={styles.snapshotTitle}>{titleize(snapshot?.granularity || "Snapshot")} report</Text>
          <Text style={styles.snapshotDate}>{periodStart} - {periodEnd}</Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{titleize(snapshot?.status || "Published")}</Text>
        </View>
      </View>

      {entries.length ? (
        <View style={styles.metricGrid}>
          {entries.map(([key, value]) => (
            <View key={key} style={styles.metricTile}>
              <Text style={styles.metricValue}>{String(value)}</Text>
              <Text style={styles.metricLabel}>{titleize(key)}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyInline}>This snapshot has no visible metrics.</Text>
      )}

      <Text style={styles.generatedText}>
        Published {formatDateTime(snapshot?.published_at || snapshot?.publishedAt || snapshot?.generated_at)}
      </Text>
    </View>
  );
};

const SummaryCard = ({ summary }) => {
  const title = summary?.title || summary?.label || summary?.type || summary?.period_key || "Summary";
  const body = summary?.body || summary?.summary || summary?.description || summary?.text;
  const visitCount = summary?.visit_count ?? summary?.visitCount;
  const activeVisitCount = summary?.active_visit_count ?? summary?.activeVisitCount;
  const completedVisitCount = summary?.completed_visit_count ?? summary?.completedVisitCount;
  const latestVisitAt = summary?.latest_visit_at || summary?.latestVisitAt;

  return (
    <View style={styles.liveCard}>
      <Feather name="file-text" size={17} color={palette.primary} />
      <View style={styles.liveCopy}>
        <Text style={styles.liveTitle}>{titleize(title)}</Text>
        {summary?.period_start || summary?.periodStart ? (
          <Text style={styles.liveMeta}>
            {formatDate(summary?.period_start || summary?.periodStart)} - {formatDate(summary?.period_end || summary?.periodEnd)}
          </Text>
        ) : null}
        {visitCount !== undefined ? (
          <View style={styles.compactMetricRow}>
            <Text style={styles.compactMetric}>{visitCount} visits</Text>
            <Text style={styles.compactMetric}>{activeVisitCount || 0} active</Text>
            <Text style={styles.compactMetric}>{completedVisitCount || 0} completed</Text>
          </View>
        ) : null}
        {latestVisitAt ? <Text style={styles.liveMeta}>Latest visit {formatDateTime(latestVisitAt)}</Text> : null}
        {body ? <Text style={styles.liveBody}>{String(body)}</Text> : null}
      </View>
    </View>
  );
};

const RecordCard = ({ record }) => {
  const title = record?.title || record?.type || record?.record_type || record?.recordType || record?.scope || "Record";
  const date = record?.record_date || record?.recordDate || record?.date || record?.created_at || record?.occurred_at || record?.updated_at;
  const body = record?.summary || record?.description || record?.notes || record?.status;
  const scope = record?.scope || record?.record_type || record?.recordType;

  return (
    <View style={styles.liveCard}>
      <Feather name="clipboard" size={17} color={palette.secondaryText} />
      <View style={styles.liveCopy}>
        <Text style={styles.liveTitle}>{titleize(title)}</Text>
        <Text style={styles.liveMeta}>{formatDateTime(date)}</Text>
        {scope ? <Text style={styles.liveMeta}>{titleize(scope)}</Text> : null}
        {body ? <Text style={styles.liveBody}>{String(body)}</Text> : null}
      </View>
    </View>
  );
};

const FamilyMemberCard = ({ member, selected, onPress }) => {
  const policy = member?.access_policy || member?.accessPolicy || {};
  const scopes = Array.isArray(policy?.scopes) ? policy.scopes : [];
  const granularity = policy?.summary_granularity || policy?.summaryGranularity || "weekly";
  const detailLevel = policy?.detail_level || policy?.detailLevel || "summary_only";
  const snapshots = Array.isArray(member?.snapshots) ? member.snapshots : [];
  const summaries = Array.isArray(member?.summaries) ? member.summaries : [];
  const records = Array.isArray(member?.records) ? member.records : [];
  const showSnapshots = granularity === "weekly" || granularity === "monthly";
  const showLiveData = granularity === "full";

  return (
    <Pressable onPress={onPress}>
      <Card style={[styles.memberCard, selected && styles.memberCardSelected]}>
        <View style={styles.memberHeader}>
          <PatientInitials name={member?.patient_name || member?.patientName} />
          <View style={styles.memberCopy}>
            <View style={styles.memberTitleRow}>
              <Text style={styles.memberName}>{member?.patient_name || member?.patientName || "Family member"}</Text>
              {selected ? <Feather name="check-circle" size={18} color={palette.successText} /> : null}
            </View>
            <Text style={styles.relationship}>{titleize(member?.relationship_type || member?.relationshipType || "Family")}</Text>
          </View>
        </View>

        <View style={styles.scopeRow}>
          {scopes.length ? scopes.map((scope) => <ScopeChip key={scope} scope={scope} />) : (
            <Text style={styles.emptyInline}>No scopes returned</Text>
          )}
        </View>

        <View style={styles.policyBlock}>
          <PolicyRow icon="calendar" label="Access" value={`${titleize(granularity)} view`} />
          <PolicyRow icon="lock" label="Detail" value={titleize(detailLevel)} />
          <PolicyRow icon="clock" label="Since" value={formatDate(policy?.allowed_since || policy?.allowedSince)} />
          <PolicyRow icon="alert-circle" label="Expires" value={policy?.expires_at ? formatDate(policy.expires_at) : "No expiry"} />
        </View>

        {detailLevel === "summary_only" ? (
          <View style={styles.notice}>
            <Feather name="shield" size={15} color={palette.warningText} />
            <Text style={styles.noticeText}>Summary-only access. Clinical details are intentionally hidden.</Text>
          </View>
        ) : null}

        {showSnapshots ? (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Published snapshots</Text>
            {snapshots.length ? (
              snapshots.map((snapshot) => (
                <SnapshotCard key={snapshot?.id || `${snapshot?.period_start}-${snapshot?.generated_at}`} snapshot={snapshot} />
              ))
            ) : (
              <Text style={styles.emptyInline}>No published snapshots yet.</Text>
            )}
          </View>
        ) : null}

        {showLiveData ? (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Live family access</Text>
            {summaries.length ? summaries.map((summary, index) => <SummaryCard key={summary?.id || `summary-${index}`} summary={summary} />) : null}
            {records.length ? records.map((record, index) => <RecordCard key={record?.id || `record-${index}`} record={record} />) : null}
            {!summaries.length && !records.length ? <Text style={styles.emptyInline}>No live family records returned.</Text> : null}
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
};

const FamilyViewScreen = () => {
  const [items, setItems] = React.useState([]);
  const [meta, setMeta] = React.useState({ page: 1, limit: FAMILY_PAGE_LIMIT, total: 0 });
  const [selectedPatientId, setSelectedPatientId] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState(null);

  const selectedMember = items.find((item) => item?.patient_id === selectedPatientId) || items[0] || null;
  const hasMore = items.length < Number(meta?.total || 0);

  const loadFamilyData = React.useCallback(async ({ page = 1, append = false } = {}) => {
    const response = await getFamilyData({ page, limit: FAMILY_PAGE_LIMIT });
    setMeta(response.meta || { page, limit: FAMILY_PAGE_LIMIT, total: response.items?.length || 0 });
    setItems((previous) => (append ? [...previous, ...(response.items || [])] : response.items || []));
    setSelectedPatientId((current) => current || response.items?.[0]?.patient_id || null);
  }, []);

  React.useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getFamilyData({ page: 1, limit: FAMILY_PAGE_LIMIT });
        if (!active) return;
        setMeta(response.meta || { page: 1, limit: FAMILY_PAGE_LIMIT, total: response.items?.length || 0 });
        setItems(response.items || []);
        setSelectedPatientId(response.items?.[0]?.patient_id || null);
      } catch (loadError) {
        if (active) setError(loadError?.message || "Unable to load family view.");
      } finally {
        if (active) setLoading(false);
      }
    };

    run();

    return () => {
      active = false;
    };
  }, []);

  const refresh = React.useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      await loadFamilyData({ page: 1 });
    } catch (refreshError) {
      setError(refreshError?.message || "Unable to refresh family view.");
    } finally {
      setRefreshing(false);
    }
  }, [loadFamilyData]);

  const loadMore = React.useCallback(async () => {
    if (!hasMore || loadingMore) return;
    try {
      setLoadingMore(true);
      const nextPage = Number(meta?.page || 1) + 1;
      await loadFamilyData({ page: nextPage, append: true });
    } catch (loadMoreError) {
      setError(loadMoreError?.message || "Unable to load more family members.");
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadFamilyData, loadingMore, meta?.page]);

  return (
    <Screen
      variant="tight"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
    >
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Feather name="users" size={22} color={palette.primary} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Family access</Text>
          <Text style={styles.title}>Family view</Text>
          <Text style={styles.subtitle}>Shared patient summaries from approved family access policies.</Text>
        </View>
      </View>

      {loading ? (
        <Card style={styles.stateCard}>
          <ActivityIndicator color={palette.primary} />
          <Text style={styles.stateText}>Loading family view...</Text>
        </Card>
      ) : null}

      {!loading && error ? (
        <Card style={styles.stateCard}>
          <Feather name="alert-circle" size={22} color={palette.dangerText} />
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Try again" onPress={refresh} variant="secondary" style={styles.retryButton} />
        </Card>
      ) : null}

      {!loading && !error && !items.length ? (
        <Card style={styles.stateCard}>
          <Feather name="users" size={22} color={palette.textMuted} />
          <Text style={styles.stateTitle}>No family access yet</Text>
          <Text style={styles.stateText}>Approved family members will appear here when the backend returns shared data.</Text>
        </Card>
      ) : null}

      {!loading && !error && items.length ? (
        <>
          <View style={styles.summaryStrip}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{items.length}</Text>
              <Text style={styles.summaryLabel}>visible</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{meta?.total || items.length}</Text>
              <Text style={styles.summaryLabel}>total</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {selectedMember?.access_policy?.summary_granularity || "weekly"}
              </Text>
              <Text style={styles.summaryLabel}>current view</Text>
            </View>
          </View>

          {items.length > 1 ? (
            <View style={styles.selectorRow}>
              {items.map((item) => {
                const selected = item?.patient_id === selectedPatientId;
                return (
                  <Pressable
                    key={item?.patient_id}
                    onPress={() => setSelectedPatientId(item?.patient_id)}
                    style={[styles.selectorChip, selected && styles.selectorChipActive]}
                  >
                    <Text style={[styles.selectorText, selected && styles.selectorTextActive]}>
                      {item?.patient_name || "Family member"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {selectedMember ? (
            <FamilyMemberCard
              member={selectedMember}
              selected
              onPress={() => setSelectedPatientId(selectedMember.patient_id)}
            />
          ) : null}

          {items.length > 1 ? (
            <View style={styles.otherMembers}>
              <Text style={styles.sectionTitle}>Other shared patients</Text>
              {items
                .filter((item) => item?.patient_id !== selectedMember?.patient_id)
                .map((item) => (
                  <FamilyMemberCard
                    key={item?.patient_id}
                    member={item}
                    selected={false}
                    onPress={() => setSelectedPatientId(item?.patient_id)}
                  />
                ))}
            </View>
          ) : null}

          {hasMore ? (
            <Button
              title={loadingMore ? "Loading..." : "Load more"}
              onPress={loadMore}
              disabled={loadingMore}
              variant="secondary"
              style={styles.loadMoreButton}
            />
          ) : null}
        </>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.primaryFixed,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    ...typography.caption,
    color: palette.secondaryText,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  title: {
    ...typography.h1,
    fontSize: 26,
  },
  subtitle: {
    ...typography.body,
    color: palette.textMuted,
    marginTop: 4,
  },
  summaryStrip: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryItem: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.surfaceBorder,
  },
  summaryValue: {
    ...typography.h3,
    color: palette.primary,
    textTransform: "capitalize",
  },
  summaryLabel: {
    ...typography.caption,
    marginTop: 2,
  },
  selectorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  selectorChip: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.surfaceBorder,
    backgroundColor: palette.surface,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  selectorChipActive: {
    borderColor: palette.primary,
    backgroundColor: palette.primaryFixed,
  },
  selectorText: {
    ...typography.caption,
    color: palette.textMuted,
    fontWeight: "700",
  },
  selectorTextActive: {
    color: palette.primary,
  },
  memberCard: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  memberCardSelected: {
    borderColor: palette.primary,
  },
  memberHeader: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  initials: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.secondaryFixed,
  },
  initialsText: {
    ...typography.h3,
    color: palette.secondaryText,
  },
  memberCopy: {
    flex: 1,
  },
  memberTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  memberName: {
    ...typography.h2,
    fontSize: 20,
    flex: 1,
  },
  relationship: {
    ...typography.body,
    color: palette.textMuted,
    marginTop: 2,
  },
  scopeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  scopeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.primaryFixed,
    backgroundColor: "#F3F8FF",
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  scopeText: {
    ...typography.caption,
    color: palette.primary,
    fontWeight: "700",
  },
  policyBlock: {
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: palette.surfaceBorder,
    paddingTop: spacing.md,
  },
  policyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  policyLabel: {
    ...typography.caption,
    minWidth: 52,
  },
  policyValue: {
    ...typography.caption,
    color: palette.text,
    fontWeight: "700",
    flex: 1,
    textTransform: "capitalize",
  },
  notice: {
    flexDirection: "row",
    gap: spacing.xs,
    alignItems: "flex-start",
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: palette.warningSurface,
  },
  noticeText: {
    ...typography.caption,
    color: palette.warningText,
    flex: 1,
    fontWeight: "700",
  },
  sectionBlock: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
  },
  snapshotCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.surfaceBorder,
    backgroundColor: palette.surfaceLow,
  },
  snapshotHeader: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  snapshotTitle: {
    ...typography.body,
    fontWeight: "800",
  },
  snapshotDate: {
    ...typography.caption,
    marginTop: 2,
  },
  statusPill: {
    alignSelf: "flex-start",
    borderRadius: radius.sm,
    backgroundColor: palette.successSurface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusText: {
    ...typography.caption,
    color: palette.successText,
    fontWeight: "800",
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metricTile: {
    minWidth: "30%",
    flexGrow: 1,
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.surfaceBorder,
  },
  metricValue: {
    ...typography.h3,
    color: palette.primary,
  },
  metricLabel: {
    ...typography.caption,
    marginTop: 2,
  },
  generatedText: {
    ...typography.caption,
  },
  liveCard: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.surfaceBorder,
    backgroundColor: palette.surfaceLow,
  },
  liveCopy: {
    flex: 1,
  },
  liveTitle: {
    ...typography.body,
    fontWeight: "800",
  },
  liveMeta: {
    ...typography.caption,
    marginTop: 2,
  },
  liveBody: {
    ...typography.body,
    color: palette.textMuted,
    marginTop: 4,
  },
  compactMetricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  compactMetric: {
    ...typography.caption,
    color: palette.primary,
    fontWeight: "800",
    backgroundColor: palette.primaryFixed,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  otherMembers: {
    gap: spacing.sm,
  },
  loadMoreButton: {
    marginTop: spacing.sm,
  },
  stateCard: {
    alignItems: "center",
    gap: spacing.sm,
  },
  stateTitle: {
    ...typography.h3,
  },
  stateText: {
    ...typography.body,
    color: palette.textMuted,
    textAlign: "center",
  },
  errorText: {
    ...typography.body,
    color: palette.dangerText,
    textAlign: "center",
  },
  retryButton: {
    minWidth: 140,
  },
  emptyInline: {
    ...typography.caption,
    color: colors.muted,
  },
});

export default FamilyViewScreen;
