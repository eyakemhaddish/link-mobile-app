import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, RefreshControl, ScrollView, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Screen from "../components/ui/Screen";
import Button from "../components/ui/Button";
import { colors, spacing, shadow } from "../theme/tokens";
import { getActiveVisit, getPatientStats } from "../services/patientService";
import { formatVisitForDisplay, getOrdersSummary } from "../utils/journeyMapper";

const palette = {
  primary: "#004277",
  primaryContainer: "#005A9E",
  primaryFixed: "#D3E4FF",
  secondaryFixed: "#B1F0CE",
  tertiaryFixed: "#FFDCC5",
  black: "#121214",
  white: "#FFFFFF",
  softWhite: "#F7FAF9",
};

const HomeScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [activeVisit, setActiveVisit] = useState(null);
  const [stats, setStats] = useState({ totalVisits: 0, activeTasks: 0, visitsToday: 0 });
  const navigation = useNavigation();

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [visitResponse, statsResponse] = await Promise.all([
        getActiveVisit(),
        getPatientStats(),
      ]);

      setPatientData(visitResponse.patient || null);
      setActiveVisit(visitResponse.activeVisit || null);
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

  const patientName = patientData?.full_name || patientData?.first_name || "Patient";
  const formattedActiveVisit = activeVisit ? formatVisitForDisplay(activeVisit) : null;
  const provider = formattedActiveVisit?.provider || activeVisit?.provider || "Staff";
  const currentStageLabel = formattedActiveVisit?.currentStage || "No active visit";
  const lastUpdatedLabel = formattedActiveVisit?.currentStageUpdatedLabel || null;
  const orderSummary = getOrdersSummary(activeVisit?.orders);

  if (loading) {
    return (
      <Screen backgroundColor={palette.white} style={styles.screenContainer} scrollable={false}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.loadingText}>Loading patient data...</Text>
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen backgroundColor={palette.white} style={styles.screenContainer} scrollable={false}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to load your patient dashboard.</Text>
          <Button title="Retry" onPress={fetchData} style={{ marginTop: spacing.md }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={palette.white} style={styles.screenContainer} scrollable={false}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />
        }
      >
        <View style={styles.canvas} testID="home-screen">
          <View style={styles.topRow}>
            <View style={styles.brandRow}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoText}>LH</Text>
              </View>
              <View>
                <Text style={styles.brandText}>Link Health</Text>
                <Text style={styles.brandSubtext}>Patient portal</Text>
              </View>
            </View>
            <View style={styles.iconRow}>
              <View style={styles.iconDot} />
              <View style={styles.iconRing} />
            </View>
          </View>

          <View style={styles.header}>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>Good morning</Text>
            </View>
            <Text style={styles.greetingTitle}>Hello, {patientName}</Text>
          </View>

          {activeVisit ? (
            <Pressable
              onPress={() =>
                navigation.navigate("PatientVisitDetails", {
                  visitId: activeVisit.id,
                  visit: activeVisit,
                  isActiveVisit: true,
                })
              }
              style={styles.bannerCard}
            >
              <View style={styles.bannerBadge}>
                <Text style={styles.bannerBadgeText}>LIVE</Text>
              </View>
              <View style={styles.bannerCopy}>
                <Text style={styles.bannerTitle}>Active visit status</Text>
                <Text style={styles.bannerSubtitle}>
                  Current stage: {currentStageLabel} · {provider}
                </Text>
                {lastUpdatedLabel ? (
                  <Text style={styles.bannerMeta}>Last update: {lastUpdatedLabel}</Text>
                ) : null}
                <Text style={styles.bannerMeta}>
                  Orders: {orderSummary.total} total · {orderSummary.completed} paid · {orderSummary.pending} pending
                </Text>
              </View>
              <View style={styles.bannerAction}>
                <Text style={styles.bannerActionText}>View Details</Text>
              </View>
            </Pressable>
          ) : (
            <View style={styles.bannerCard}>
              <View style={styles.bannerCopy}>
                <Text style={styles.bannerTitle}>No active visit</Text>
                <Text style={styles.bannerSubtitle}>
                  You do not have any active visits at the moment.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={[styles.statPill, styles.statPurple]}>
              <Text style={styles.statValue}>{stats.totalVisits}</Text>
              <Text style={styles.statLabel}>Records</Text>
            </View>
            <View style={[styles.statPill, styles.statGreen]}>
              <Text style={styles.statValue}>{stats.activeTasks}</Text>
              <Text style={styles.statLabel}>Tasks</Text>
            </View>
            <View style={[styles.statPill, styles.statDark]}>
              <Text style={[styles.statValue, styles.statValueLight]}>{stats.visitsToday}</Text>
              <Text style={[styles.statLabel, styles.statValueLight]}>Today</Text>
            </View>
          </View>

          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Overview</Text>
          </View>

          <View style={styles.cardGrid}>
            <Pressable
              style={[styles.largeCard, styles.greenCard]}
              onPress={() => navigation.navigate("SymptomCheckerConversational")}
            >
              <Text style={styles.cardTitle}>Symptom Check</Text>
              <Text style={styles.cardBody}>
                Answer a few quick questions and get guidance.
              </Text>
              <View style={styles.actionPill}>
                <Text style={styles.actionText}>Start now</Text>
              </View>
            </Pressable>
            <View style={styles.smallColumn}>
              <Pressable
                style={[styles.smallCard, styles.lightPurpleCard]}
                onPress={() => navigation.navigate("Facilities")}
              >
                <Text style={styles.cardTitle}>Find care</Text>
                <Text style={styles.cardBody}>
                  Nearby clinics and pharmacies.
                </Text>
                <Text style={styles.cardMeta}>Open finder</Text>
              </Pressable>
              <Pressable
                style={[styles.smallCard, styles.darkPurpleCard]}
                onPress={() => navigation.navigate("PatientHealthRecords")}
              >
                <Text style={[styles.cardTitle, styles.lightText]}>Visit history</Text>
                <Text style={[styles.cardBody, styles.lightText]}>
                  Review records, visit outputs, and lab results.
                </Text>
                <Text style={[styles.cardMeta, styles.lightText]}>View records</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Services</Text>
          </View>

          <View style={styles.servicesRow}>
            <Pressable
              style={[styles.serviceCard, styles.lightPurpleCard]}
              onPress={() => navigation.navigate("PatientAppointments")}
            >
              <Text style={styles.cardTitle}>Appointments</Text>
              <Text style={styles.cardBody}>Book and manage visits.</Text>
              <Text style={styles.cardMeta}>Book now</Text>
            </Pressable>
            <Pressable
              style={[styles.serviceCard, styles.greenCard]}
              onPress={() => navigation.navigate("PatientConsent")}
            >
              <Text style={styles.cardTitle}>Consent</Text>
              <Text style={styles.cardBody}>Manage data sharing.</Text>
              <Text style={styles.cardMeta}>Manage</Text>
            </Pressable>
            <Pressable
              style={[styles.serviceCard, styles.recordsCard]}
              onPress={() => navigation.navigate("PatientHealthRecords")}
            >
              <Text style={styles.cardTitle}>Records</Text>
              <Text style={styles.cardBody}>Your visits, results, and documents.</Text>
              <Text style={styles.cardMeta}>Open</Text>
            </Pressable>
          </View>
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
    backgroundColor: palette.softWhite,
    padding: spacing.lg,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: palette.primaryFixed,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: palette.primary,
    fontWeight: "800",
    fontSize: 12,
  },
  brandText: {
    fontSize: 14,
    fontWeight: "700",
    color: palette.primary,
    letterSpacing: 0.5,
  },
  brandSubtext: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.secondaryFixed,
  },
  iconRing: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: palette.primary,
  },
  header: { marginBottom: spacing.md, gap: spacing.xs },
  headerBadge: {
    alignSelf: "flex-start",
    backgroundColor: palette.tertiaryFixed,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#713700",
    textTransform: "uppercase",
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: palette.primary,
    fontFamily: "Manrope",
  },
  bannerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.white,
    borderRadius: 22,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#E0E3E2",
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  bannerBadge: {
    backgroundColor: palette.primaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: spacing.md,
  },
  bannerBadgeText: {
    color: palette.white,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  bannerCopy: { flex: 1 },
  bannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: palette.black,
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: palette.black,
    opacity: 0.65,
  },
  bannerMeta: {
    fontSize: 12,
    color: palette.black,
    opacity: 0.5,
    marginTop: 2,
  },
  bannerAction: {
    backgroundColor: palette.primaryFixed,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  bannerActionText: {
    fontSize: 11,
    fontWeight: "700",
    color: palette.primary,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statPill: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    alignItems: "center",
  },
  statPurple: { backgroundColor: palette.primaryFixed },
  statGreen: { backgroundColor: palette.secondaryFixed },
  statDark: { backgroundColor: palette.primaryContainer },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: palette.black,
  },
  statLabel: {
    fontSize: 12,
    color: palette.black,
    opacity: 0.7,
  },
  statValueLight: { color: palette.white },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: palette.black,
    fontFamily: "Manrope",
  },
  cardGrid: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  largeCard: {
    flex: 1,
    borderRadius: 20,
    padding: spacing.md,
    justifyContent: "space-between",
    minHeight: 190,
    backgroundColor: palette.secondaryFixed,
  },
  smallColumn: {
    flex: 1,
    gap: spacing.md,
  },
  smallCard: {
    borderRadius: 18,
    padding: spacing.md,
    minHeight: 90,
    justifyContent: "space-between",
  },
  greenCard: { backgroundColor: palette.secondaryFixed },
  lightPurpleCard: { backgroundColor: palette.primaryFixed },
  darkPurpleCard: { backgroundColor: palette.primaryContainer },
  recordsCard: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: "#E0E3E2",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: palette.black,
    marginBottom: spacing.xs,
    fontFamily: "Manrope",
  },
  cardBody: {
    fontSize: 12,
    color: palette.black,
    opacity: 0.7,
  },
  cardMeta: {
    marginTop: spacing.sm,
    fontSize: 12,
    fontWeight: "600",
    color: palette.black,
  },
  actionPill: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
    backgroundColor: palette.white,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.primary,
  },
  lightText: { color: palette.white },
  servicesRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  serviceCard: {
    flex: 1,
    borderRadius: 18,
    padding: spacing.md,
    minHeight: 108,
    justifyContent: "space-between",
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
});

export default HomeScreen;
