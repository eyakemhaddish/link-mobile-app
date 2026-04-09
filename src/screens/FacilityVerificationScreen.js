import React from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import Card from "../components/ui/Card";
import HeroHeader from "../components/ui/HeroHeader";
import Screen from "../components/ui/Screen";
import { useAuth } from "../context/AuthContext";
import { getFacilityRegistrations } from "../services/patientService";
import { patientPortalPalette as palette } from "../theme/patientPortal";
import { shadow, spacing, typography } from "../theme/tokens";

const asArray = (value) => (Array.isArray(value) ? value : []);

const toTitle = (value) =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());

const normalizeFacilityItems = (response) => {
  const list =
    response?.items ||
    response?.facilities ||
    response?.data ||
    (Array.isArray(response) ? response : []);

  return asArray(list).map((item) => {
    const sourceFlags = String(item?.sources || "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map(toTitle);

    const detectedFlags = [
      ...(item?.is_registered_here || item?.isRegisteredHere ? ["Patient record"] : []),
      ...(item?.has_visit_history || item?.hasVisitHistory ? ["Visit history"] : []),
      ...(item?.has_appointment_request || item?.hasAppointmentRequest
        ? ["Appointment request"]
        : []),
      ...sourceFlags,
    ];

    const verificationStatus = String(
      item?.phone_verification_status ||
        item?.phoneVerificationStatus ||
        (item?.is_verified_here || item?.isVerifiedHere ? "verified" : "unverified"),
    ).toLowerCase();

    const isVerifiedStatus = ["verified", "complete", "completed"].includes(
      verificationStatus,
    );

    return {
      id: item?.id,
      name: item?.name || "Facility",
      location: item?.location || item?.address || "",
      phoneNumber: item?.phone_number || item?.phoneNumber || "",
      facilityType: item?.facility_type || item?.facilityType || "",
      isVerified:
        Boolean(item?.is_verified_here ?? item?.isVerifiedHere) ||
        isVerifiedStatus,
      verificationStatus,
      phoneVerifiedAt: item?.phone_verified_at || item?.phoneVerifiedAt || null,
      visitCount: item?.visit_count || item?.visitCount || 0,
      flags: [...new Set(detectedFlags)],
    };
  });
};

const formatStatus = (status) => {
  const normalized = toTitle(status || "unverified");
  return normalized || "Unverified";
};

const FacilityVerificationScreen = () => {
  const { user } = useAuth();
  const patientPhone = user?.phone_number || user?.phone || user?.mobile_number || "";

  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [facilities, setFacilities] = React.useState([]);
  const [error, setError] = React.useState("");

  const loadData = React.useCallback(async () => {
    try {
      setError("");
      const response = await getFacilityRegistrations();
      setFacilities(normalizeFacilityItems(response));
    } catch (loadError) {
      console.error("Failed to load facility verification page:", loadError);
      setError(loadError?.message || "Unable to load facility verification.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const verifiedFacilities = facilities.filter((facility) => facility.isVerified);
  const needsVerification = facilities.filter((facility) => !facility.isVerified);

  if (loading) {
    return (
      <Screen backgroundColor={palette.surface} scrollable={false}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={palette.surface} scrollable={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor={palette.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <HeroHeader
          badge="Verification"
          title="Facility Verification"
          subtitle="We detected activity at these facilities. Verification is needed to access medical records, and this page shows where your phone is already trusted."
          style={styles.header}
        />

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Verification summary</Text>
          <Text style={styles.summaryBody}>
            Phone: {patientPhone || "Not available"}
          </Text>
          <Text style={styles.summaryBody}>
            Verified at {verifiedFacilities.length} facility{verifiedFacilities.length === 1 ? "" : "ies"}.
          </Text>
          <Text style={styles.summaryBody}>
            Verification still needed at {needsVerification.length}.
          </Text>
        </Card>

        {error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verified here</Text>
          {verifiedFacilities.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No facilities are verified yet</Text>
            </Card>
          ) : (
            verifiedFacilities.map((facility) => (
              <FacilityRow key={facility.id} facility={facility} verified />
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Needs verification</Text>
          {needsVerification.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>All detected facilities are already verified</Text>
            </Card>
          ) : (
            needsVerification.map((facility) => (
              <FacilityRow key={facility.id} facility={facility} verified={false} />
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
};

const FacilityRow = ({ facility, verified }) => (
  <Card style={styles.facilityCard}>
    <View style={styles.cardTopRow}>
      <View style={styles.facilityCopy}>
        <Text style={styles.facilityName}>{facility.name}</Text>
        {!!facility.location && <Text style={styles.detailText}>{facility.location}</Text>}
        {!!facility.phoneNumber && <Text style={styles.detailText}>{facility.phoneNumber}</Text>}
        {!!facility.facilityType && (
          <Text style={styles.facilityMeta}>{toTitle(facility.facilityType)}</Text>
        )}
      </View>
      <View style={[styles.statusBadge, verified ? styles.statusBadgeVerified : styles.statusBadgePending]}>
        <Text style={verified ? styles.statusBadgeTextVerified : styles.statusBadgeTextPending}>
          {verified ? "Verified" : "Verify in facility"}
        </Text>
      </View>
    </View>

    <View style={styles.metaRow}>
      <Feather name="shield" size={14} color={palette.textMuted} />
      <Text style={styles.metaText}>{formatStatus(facility.verificationStatus)}</Text>
    </View>

    {facility.phoneVerifiedAt ? (
      <View style={styles.metaRow}>
        <Feather name="clock" size={14} color={palette.textMuted} />
        <Text style={styles.metaText}>
          Verified on {new Date(facility.phoneVerifiedAt).toLocaleDateString()}
        </Text>
      </View>
    ) : null}

    {facility.visitCount ? (
      <View style={styles.metaRow}>
        <Feather name="activity" size={14} color={palette.textMuted} />
        <Text style={styles.metaText}>
          {facility.visitCount} visit{facility.visitCount === 1 ? "" : "s"} detected
        </Text>
      </View>
    ) : null}

    {facility.flags.length ? (
      <View style={styles.flagRow}>
        {facility.flags.map((flag) => (
          <View key={`${facility.id}-${flag}`} style={styles.flagChip}>
            <Text style={styles.flagChipText}>{flag}</Text>
          </View>
        ))}
      </View>
    ) : null}
  </Card>
);

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  header: {
    marginBottom: spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCard: {
    marginBottom: spacing.md,
    backgroundColor: palette.surfaceLowest,
    borderColor: "#E0E3E2",
    ...shadow.card,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: palette.text,
    marginBottom: 6,
  },
  summaryBody: {
    ...typography.body,
    color: palette.textMuted,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: palette.text,
  },
  facilityCard: {
    gap: spacing.sm,
    backgroundColor: palette.surfaceLowest,
    borderColor: "#E0E3E2",
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  facilityCopy: {
    flex: 1,
  },
  facilityName: {
    fontSize: 17,
    fontWeight: "800",
    color: palette.text,
  },
  facilityMeta: {
    ...typography.caption,
    color: palette.textMuted,
    marginTop: 4,
  },
  detailText: {
    ...typography.body,
    color: palette.textMuted,
    marginTop: 4,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  statusBadgeVerified: {
    backgroundColor: "#D9FBE5",
  },
  statusBadgePending: {
    backgroundColor: "#FCE8D4",
  },
  statusBadgeTextVerified: {
    fontSize: 12,
    fontWeight: "800",
    color: "#166534",
  },
  statusBadgeTextPending: {
    fontSize: 12,
    fontWeight: "800",
    color: "#9A3412",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    ...typography.caption,
    color: palette.textMuted,
    fontWeight: "700",
  },
  flagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  flagChip: {
    backgroundColor: palette.surfaceLow,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  flagChipText: {
    ...typography.caption,
    color: palette.text,
    fontWeight: "700",
  },
  emptyCard: {
    backgroundColor: palette.surfaceLowest,
    borderColor: "#E0E3E2",
  },
  emptyTitle: {
    ...typography.body,
    color: palette.textMuted,
    fontWeight: "700",
  },
  errorCard: {
    marginBottom: spacing.md,
    backgroundColor: "#FFF2F2",
    borderColor: "#FECACA",
  },
  errorText: {
    color: "#B91C1C",
    fontWeight: "700",
  },
});

export default FacilityVerificationScreen;
