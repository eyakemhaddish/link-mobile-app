import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import Screen from "../components/ui/Screen";
import Button from "../components/ui/Button";
import { colors, spacing, shadow } from "../theme/tokens";
import { patientPortalPalette as palette } from "../theme/patientPortal";
import { getActiveVisit, getPatientRealtimeFeed, getPatientStats } from "../services/patientService";
import { inferPatientFeedAction, performPatientFeedAction } from "../utils/patientFeedActions";
import { formatVisitForDisplay, getOrdersSummary } from "../utils/journeyMapper";

const HomeScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [activeVisits, setActiveVisits] = useState([]);
  const [feedItems, setFeedItems] = useState([]);
  const [stats, setStats] = useState({
    totalVisits: 0,
    activeTasks: 0,
    visitsToday: 0,
  });
  const navigation = useNavigation();

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [visitResponse, statsResponse, feedResponse] = await Promise.all([
        getActiveVisit(),
        getPatientStats(),
        getPatientRealtimeFeed().catch(() => ({ items: [] })),
      ]);

      setPatientData(visitResponse?.patient || null);
      setActiveVisits(
        Array.isArray(visitResponse?.activeVisits)
          ? visitResponse.activeVisits
          : visitResponse?.activeVisit
            ? [visitResponse.activeVisit]
            : [],
      );
      setFeedItems(Array.isArray(feedResponse?.items) ? feedResponse.items.slice(0, 4) : []);
      setStats(statsResponse || { totalVisits: 0, activeTasks: 0, visitsToday: 0 });
    } catch (err) {
      console.error("Failed to fetch patient data:", err);
      setError(err?.message || "Failed to load patient data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const patientName = patientData?.first_name || patientData?.full_name || "Patient";
  const primaryVisit = activeVisits[0] || null;

  if (loading) {
    return (
      <Screen backgroundColor={palette.background} style={styles.screenContainer} scrollable={false}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.loadingText}>Loading patient data...</Text>
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen backgroundColor={palette.background} style={styles.screenContainer} scrollable={false}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to load your patient dashboard.</Text>
          <Button title="Retry" onPress={fetchData} style={styles.retryButton} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={palette.background} style={styles.screenContainer} scrollable={false}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.primary}
          />
        }
      >
        <View style={styles.canvas} testID="home-screen">
          <View style={styles.topBar}>
            <View style={styles.topBarIdentity}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {String(patientName || "P").charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.topBarGreeting}>Good morning, {patientName}</Text>
                <Text style={styles.topBarSubtext}>Patient portal</Text>
              </View>
            </View>
            <View style={styles.topBarDot} />
          </View>

          {primaryVisit ? (
            <Pressable
              style={styles.primaryStatusCard}
              onPress={() =>
                navigation.navigate("PatientVisitDetails", {
                  visitId: primaryVisit.id,
                  visit: primaryVisit,
                  isActiveVisit: true,
                })
              }
            >
              <View style={styles.primaryStatusGlow} />
              <View style={styles.primaryStatusInner}>
                <View style={styles.primaryStatusBadgeRow}>
                  <View style={styles.statusIconBadge}>
                    <Feather name="activity" size={16} color={palette.textOnDark} />
                  </View>
                  <Text style={styles.primaryStatusEyebrow}>Active Visit Case</Text>
                </View>
                <Text style={styles.primaryStatusTitle}>
                  {primaryVisit.facility_name || "Current visit"}
                </Text>
                <Text style={styles.primaryStatusBody}>
                  {formatVisitForDisplay(primaryVisit)?.currentStage || "In progress"} with{" "}
                  {formatVisitForDisplay(primaryVisit)?.provider ||
                    primaryVisit.provider ||
                    "care team"}
                </Text>
                <Pressable
                  style={styles.primaryStatusAction}
                  onPress={() =>
                    navigation.navigate("PatientVisitDetails", {
                      visitId: primaryVisit.id,
                      visit: primaryVisit,
                      isActiveVisit: true,
                    })
                  }
                >
                  <Text style={styles.primaryStatusActionText}>View visit details</Text>
                </Pressable>
              </View>
            </Pressable>
          ) : (
            <View style={styles.emptyStatusCard}>
              <Text style={styles.emptyStatusTitle}>No active visit</Text>
              <Text style={styles.emptyStatusBody}>
                You do not have any active visits at the moment.
              </Text>
            </View>
          )}

          {feedItems.length > 0 ? (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Live updates</Text>
                <Text style={styles.sectionCaption}>{feedItems.length} items</Text>
              </View>
              {feedItems.map((item) => {
                const inferredAction = inferPatientFeedAction(item);
                return (
                  <Pressable
                    key={item.id}
                    style={styles.feedCard}
                    onPress={() => performPatientFeedAction(navigation, item)}
                  >
                    <View style={styles.feedCardHeader}>
                      <View style={styles.feedIconWrap}>
                        <Feather
                          name={inferredAction.icon || "bell"}
                          size={18}
                          color={palette.primary}
                        />
                      </View>
                      <View style={styles.feedCopy}>
                        <Text style={styles.feedTitle}>{item.title || "Update"}</Text>
                        <Text style={styles.feedBody}>
                          {item.description || "A new update is available."}
                        </Text>
                        <Text style={styles.feedMeta}>
                          {item.facility_name || "Facility"} · {item.resource_type || "update"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.feedActions}>
                      <View style={styles.feedActionPrimary}>
                        <Text style={styles.feedActionPrimaryText}>{inferredAction.label}</Text>
                      </View>
                      {inferredAction.secondaryLabel ? (
                        <Text style={styles.feedActionSecondaryText}>
                          {inferredAction.secondaryLabel}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionEyebrow}>Quick Actions</Text>
            <View style={styles.quickActionRow}>
              <Pressable
                style={styles.quickActionCard}
                onPress={() => navigation.navigate("SymptomCheckerConversational")}
              >
                <View style={[styles.quickActionIconWrap, styles.quickActionSand]}>
                  <Feather name="activity" size={20} color={palette.secondaryText} />
                </View>
                <Text style={styles.quickActionLabel}>Check symptoms</Text>
              </Pressable>
              <Pressable
                style={styles.quickActionCard}
                onPress={() =>
                  navigation.navigate("PatientAppointments", { startBooking: true })
                }
              >
                <View style={[styles.quickActionIconWrap, styles.quickActionBlue]}>
                  <Feather name="calendar" size={20} color={palette.primary} />
                </View>
                <Text style={styles.quickActionLabel}>Book appointment</Text>
              </Pressable>
              <Pressable
                style={styles.quickActionCard}
                onPress={() => navigation.navigate("PatientHealthRecords")}
              >
                <View style={[styles.quickActionIconWrap, styles.quickActionPeach]}>
                  <Feather name="folder" size={20} color="#713700" />
                </View>
                <Text style={styles.quickActionLabel}>Open records</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.bentoGrid}>
            <Pressable
              style={styles.infoCard}
              onPress={() => navigation.navigate("PatientAppointments")}
            >
              <View style={styles.infoCardHeader}>
                <Text style={styles.infoBadge}>Upcoming</Text>
                <Text style={styles.infoMeta}>
                  {stats.visitsToday > 0 ? `${stats.visitsToday} today` : "No visit today"}
                </Text>
              </View>
              <Text style={styles.infoCardTitle}>Appointments</Text>
              <Text style={styles.infoCardBody}>
                Book and manage your upcoming visits and prepare before you go.
              </Text>
              <Text style={styles.infoCardLink}>Open appointments</Text>
            </Pressable>

            <View style={styles.highlightCard}>
              <Text style={styles.highlightEyebrow}>Visit Summary</Text>
              <Text style={styles.highlightTitle}>
                {activeVisits.length} active {activeVisits.length === 1 ? "visit" : "visits"}
              </Text>
              <Text style={styles.highlightBody}>
                {primaryVisit
                  ? `${getOrdersSummary(primaryVisit.orders).total} orders currently attached to your main active visit.`
                  : "Your dashboard will show live orders and results here once a visit starts."}
              </Text>
            </View>

            <Pressable
              style={styles.trackCard}
              onPress={() => navigation.navigate("PatientHealthRecords")}
            >
              <View style={styles.trackIconWrap}>
                <Feather name="file-text" size={20} color="#93000A" />
              </View>
              <View style={styles.trackCopy}>
                <Text style={styles.trackTitle}>Records</Text>
                <Text style={styles.trackBody}>Visits, results, and documents in one place.</Text>
              </View>
            </Pressable>

            <Pressable
              style={styles.consentCard}
              onPress={() => navigation.navigate("PatientConsent")}
            >
              <Text style={styles.consentEyebrow}>Records and Consent</Text>
              <Text style={styles.consentTitle}>Data sharing is manageable here</Text>
              <Text style={styles.consentBody}>
                Review who can access your information and update permissions clearly.
              </Text>
              <Text style={styles.consentLink}>Manage access</Text>
            </Pressable>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Active visits</Text>
            <Text style={styles.sectionCaption}>
              {activeVisits.length === 0
                ? "No live visits"
                : `${activeVisits.length} in progress`}
            </Text>
          </View>

          {activeVisits.length === 0 ? (
            <View style={styles.emptyListCard}>
              <Text style={styles.emptyListTitle}>No active visits right now</Text>
              <Text style={styles.emptyListBody}>
                When your next visit starts, live status and orders will appear here.
              </Text>
            </View>
          ) : (
            activeVisits.map((visit) => {
              const displayVisit = formatVisitForDisplay(visit);
              const orderSummary = getOrdersSummary(visit?.orders);
              return (
                <Pressable
                  key={visit.id}
                  style={styles.visitCard}
                  onPress={() =>
                    navigation.navigate("PatientVisitDetails", {
                      visitId: visit.id,
                      visit,
                      isActiveVisit: true,
                    })
                  }
                >
                  <View style={styles.visitCardHeader}>
                    <View style={styles.visitCardCopy}>
                      <Text style={styles.visitCardTitle}>
                        {visit.facility_name || "Active visit"}
                      </Text>
                      <Text style={styles.visitCardMeta}>
                        {displayVisit?.currentStage || "In progress"} ·{" "}
                        {displayVisit?.provider || visit.provider || "Care team"}
                      </Text>
                    </View>
                    <View style={styles.livePill}>
                      <Text style={styles.livePillText}>Live</Text>
                    </View>
                  </View>
                  <Text style={styles.visitCardBody}>
                    {visit.chief_complaint || "Visit details available in the timeline."}
                  </Text>
                  <Text style={styles.visitCardHint}>
                    Orders: {orderSummary.total} total · {orderSummary.completed} completed ·{" "}
                    {orderSummary.pending} pending
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screenContainer: { padding: 0 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xl * 2 },
  canvas: {
    flex: 1,
    backgroundColor: palette.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  topBarIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.primaryFixed,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#C6DCF8",
  },
  avatarText: {
    color: palette.primary,
    fontSize: 16,
    fontWeight: "800",
  },
  topBarGreeting: {
    fontSize: 18,
    fontWeight: "800",
    color: palette.primaryContainer,
  },
  topBarSubtext: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  topBarDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.primaryFixed,
    borderWidth: 2,
    borderColor: palette.primary,
  },
  primaryStatusCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: palette.primary,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadow.card,
  },
  primaryStatusGlow: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  primaryStatusInner: {
    gap: spacing.sm,
  },
  primaryStatusBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  statusIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryStatusEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.84)",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  primaryStatusTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: palette.textOnDark,
  },
  primaryStatusBody: {
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.86)",
  },
  primaryStatusAction: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    backgroundColor: "#AEEECB",
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  primaryStatusActionText: {
    color: "#0E5138",
    fontSize: 14,
    fontWeight: "800",
  },
  emptyStatusCard: {
    borderRadius: 24,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  emptyStatusTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: palette.black,
    marginBottom: spacing.xs,
  },
  emptyStatusBody: {
    fontSize: 14,
    color: palette.muted,
    lineHeight: 20,
  },
  feedCard: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.surfaceBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  feedCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  feedIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.primaryFixed,
    alignItems: "center",
    justifyContent: "center",
  },
  feedCopy: {
    flex: 1,
  },
  feedTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: palette.text,
  },
  feedBody: {
    fontSize: 13,
    lineHeight: 18,
    color: palette.textMuted,
    marginTop: 2,
  },
  feedMeta: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.secondaryText,
    marginTop: spacing.xs,
    textTransform: "capitalize",
  },
  feedActions: {
    marginTop: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  feedActionPrimary: {
    backgroundColor: palette.primaryFixed,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  feedActionPrimaryText: {
    fontSize: 12,
    fontWeight: "800",
    color: palette.primary,
  },
  feedActionSecondaryText: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.secondaryText,
  },
  sectionBlock: {
    marginBottom: spacing.xl,
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    color: palette.muted,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  quickActionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  quickActionCard: {
    flex: 1,
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: palette.white,
    borderRadius: 18,
    ...shadow.card,
  },
  quickActionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionSand: {
    backgroundColor: palette.secondaryFixed,
  },
  quickActionBlue: {
    backgroundColor: palette.primaryFixed,
  },
  quickActionPeach: {
    backgroundColor: palette.tertiaryFixed,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.black,
    textAlign: "center",
    lineHeight: 16,
  },
  bentoGrid: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  infoCard: {
    backgroundColor: palette.white,
    borderRadius: 20,
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: palette.primary,
    ...shadow.card,
  },
  infoCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  infoBadge: {
    backgroundColor: palette.primaryFixed,
    color: palette.primary,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  infoMeta: {
    fontSize: 12,
    color: palette.muted,
    fontWeight: "600",
  },
  infoCardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: palette.primary,
    marginBottom: 4,
  },
  infoCardBody: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.muted,
  },
  infoCardLink: {
    marginTop: spacing.md,
    fontSize: 14,
    fontWeight: "800",
    color: palette.primary,
  },
  highlightCard: {
    backgroundColor: "#AEEECB",
    borderRadius: 20,
    padding: spacing.lg,
    overflow: "hidden",
  },
  highlightEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#0E5138",
    marginBottom: spacing.sm,
  },
  highlightTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#002114",
    marginBottom: spacing.xs,
  },
  highlightBody: {
    fontSize: 14,
    lineHeight: 20,
    color: "#18452F",
  },
  trackCard: {
    backgroundColor: palette.surfaceLow,
    borderRadius: 20,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  trackIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFDAD6",
    alignItems: "center",
    justifyContent: "center",
  },
  trackCopy: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: palette.black,
  },
  trackBody: {
    fontSize: 13,
    lineHeight: 18,
    color: palette.muted,
    marginTop: 2,
  },
  consentCard: {
    backgroundColor: palette.tertiaryFixed,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  consentEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#713700",
  },
  consentTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#301400",
  },
  consentBody: {
    fontSize: 13,
    lineHeight: 18,
    color: "#713700",
  },
  consentLink: {
    fontSize: 14,
    fontWeight: "800",
    color: "#8B4500",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: palette.black,
  },
  sectionCaption: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.muted,
    textTransform: "uppercase",
  },
  emptyListCard: {
    backgroundColor: palette.white,
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: palette.border,
  },
  emptyListTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: palette.black,
    marginBottom: spacing.xs,
  },
  emptyListBody: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.muted,
  },
  visitCard: {
    backgroundColor: palette.white,
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  visitCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  visitCardCopy: {
    flex: 1,
  },
  visitCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: palette.black,
  },
  visitCardMeta: {
    fontSize: 13,
    color: palette.primary,
    marginTop: 2,
    fontWeight: "600",
  },
  livePill: {
    backgroundColor: palette.primaryFixed,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  livePillText: {
    fontSize: 11,
    fontWeight: "800",
    color: palette.primary,
    textTransform: "uppercase",
  },
  visitCardBody: {
    fontSize: 13,
    lineHeight: 18,
    color: palette.muted,
    marginTop: spacing.xs,
  },
  visitCardHint: {
    marginTop: spacing.sm,
    fontSize: 12,
    fontWeight: "700",
    color: palette.secondaryText,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: palette.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
    textAlign: "center",
  },
  retryButton: {
    marginTop: spacing.md,
  },
});

export default HomeScreen;
