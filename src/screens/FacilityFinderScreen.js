import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  TextInput,
  Linking,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Screen from "../components/ui/Screen";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import HeroHeader from "../components/ui/HeroHeader";
import { colors, radius, spacing, typography } from "../theme/tokens";
import { patientPortalPalette as palette } from "../theme/patientPortal";
import { useToast } from "../context/ToastContext";
import { getFacilities, getPublicDirectoryFacilities } from "../services/patientService";

const FACILITY_FILTERS = [
  { value: "all", label: "All" },
  { value: "hospital", label: "Hospitals" },
  { value: "health_center", label: "Health Centers" },
  { value: "clinic", label: "Clinics" },
  { value: "specialized", label: "Specialized" },
];

const formatFacilityType = (value) => {
  if (!value) return "Facility";
  return String(value)
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const FacilityFinderScreen = ({ navigation }) => {
  const { showToast } = useToast();
  const [facilities, setFacilities] = React.useState([]);
  const [connectedFacilityIds, setConnectedFacilityIds] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterType, setFilterType] = React.useState("all");

  const loadFacilities = React.useCallback(async () => {
    setLoading(true);
    try {
      const [publicResult, connectedResult] = await Promise.allSettled([
        getPublicDirectoryFacilities({ limit: 200 }),
        getFacilities(),
      ]);

      if (publicResult.status !== "fulfilled") {
        throw publicResult.reason;
      }

      const publicFacilities = Array.isArray(publicResult.value?.facilities)
        ? publicResult.value.facilities
        : [];
      setFacilities(publicFacilities);

      if (connectedResult.status === "fulfilled") {
        const connectedFacilities = Array.isArray(connectedResult.value?.facilities)
          ? connectedResult.value.facilities
          : [];
        setConnectedFacilityIds(connectedFacilities.map((facility) => facility.id));
      } else {
        setConnectedFacilityIds([]);
      }
    } catch (error) {
      setFacilities([]);
      setConnectedFacilityIds([]);
      showToast(error?.message || "Unable to load facilities.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  React.useEffect(() => {
    loadFacilities();
  }, [loadFacilities]);

  const connectedFacilityIdSet = React.useMemo(
    () => new Set(connectedFacilityIds),
    [connectedFacilityIds]
  );

  const filteredFacilities = React.useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return facilities.filter((facility) => {
      if (filterType !== "all" && facility.facility_type !== filterType) {
        return false;
      }
      if (!query) return true;
      return [facility.name, facility.location, facility.address, facility.phone_number]
        .map((value) => String(value || "").toLowerCase())
        .some((value) => value.includes(query));
    });
  }, [facilities, filterType, searchTerm]);

  const handleDirections = React.useCallback((facility) => {
    const query = [facility.name, facility.address || facility.location || ""]
      .filter(Boolean)
      .join(" ");
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    Linking.openURL(url);
  }, []);

  const handleCall = React.useCallback((phoneNumber) => {
    if (!phoneNumber) return;
    Linking.openURL(`tel:${phoneNumber}`);
  }, []);

  const handleBookAppointment = React.useCallback((facility) => {
    navigation.navigate("PatientAppointments", {
      startBooking: true,
      prefillFacilityId: facility.id,
      prefillFacilityName: facility.name,
    });
  }, [navigation]);

  return (
    <Screen backgroundColor={palette.background}>
      <HeroHeader
        badge="Care directory"
        title="Find a clinic"
        subtitle="Discover Link-enabled clinics and providers near you."
        style={styles.header}
      />

      <Card style={styles.searchCard}>
        <View style={styles.searchCardHeader}>
          <View>
            <Text style={styles.searchCardTitle}>Search by facility or location</Text>
            <Text style={styles.searchCardBody}>Use the directory below to find care and move directly into booking.</Text>
          </View>
          <View style={styles.searchCardIconWrap}>
            <Feather name="search" size={20} color={palette.primary} />
          </View>
        </View>
        <TextInput
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search by facility or location"
          style={styles.searchInput}
          placeholderTextColor={colors.muted}
        />
        <View style={styles.filterRow}>
          {FACILITY_FILTERS.map((filter) => {
            const active = filterType === filter.value;
            return (
              <Pressable
                key={filter.value}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilterType(filter.value)}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading facilities...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.resultsCount}>
            {filteredFacilities.length} {filteredFacilities.length === 1 ? "facility" : "facilities"} available
          </Text>

          {filteredFacilities.length === 0 ? (
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>No matching facilities</Text>
              <Text style={styles.cardBody}>
                Try another search term or switch facility type filters.
              </Text>
              <View style={styles.cardActions}>
                <Button title="Refresh directory" variant="secondary" onPress={loadFacilities} />
              </View>
            </Card>
          ) : (
            filteredFacilities.map((facility) => (
              <Card style={styles.card} key={facility.id}>
                <View style={styles.facilityHeader}>
                  <View style={styles.facilityIdentity}>
                    <View style={styles.facilityIcon}>
                      <Feather name="map-pin" size={18} color={palette.secondary} />
                    </View>
                    <View style={styles.facilityTitleWrap}>
                      <Text style={styles.cardTitle}>{facility.name}</Text>
                      <Text style={styles.facilityLocation}>
                        {facility.address || facility.location || "Location details unavailable"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.typeBadge}>{formatFacilityType(facility.facility_type)}</Text>
                </View>

                {facility.phone_number ? (
                  <Pressable onPress={() => handleCall(facility.phone_number)}>
                    <Text style={styles.phoneText}>{facility.phone_number}</Text>
                  </Pressable>
                ) : null}

                <View style={styles.metaRow}>
                  {facility.accepts_walk_ins ? (
                    <Text style={styles.metaBadge}>Accepts walk-ins</Text>
                  ) : null}
                  {facility.workspace?.workspaceType === "provider" ? (
                    <Text style={styles.metaBadge}>Solo provider</Text>
                  ) : (
                    <Text style={styles.metaBadge}>Clinic network</Text>
                  )}
                  {connectedFacilityIdSet.has(facility.id) ? (
                    <Text style={styles.metaBadge}>Connected to your care team</Text>
                  ) : null}
                </View>

                <View style={styles.actionsRow}>
                  <Button
                    title="Book appointment"
                    onPress={() => handleBookAppointment(facility)}
                    style={styles.actionButton}
                  />
                  <Button
                    title="Directions"
                    variant="secondary"
                    onPress={() => handleDirections(facility)}
                    style={styles.actionButton}
                  />
                  {facility.phone_number ? (
                    <Button
                      title="Call"
                      variant="ghost"
                      onPress={() => handleCall(facility.phone_number)}
                      style={styles.actionButton}
                    />
                  ) : null}
                </View>
              </Card>
            ))
          )}
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.md,
  },
  searchCard: {
    gap: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: palette.surface,
    borderColor: palette.surfaceBorder,
    borderRadius: 20,
    padding: spacing.md,
  },
  searchCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  searchCardTitle: {
    ...typography.h3,
    color: palette.text,
  },
  searchCardBody: {
    ...typography.body,
    color: palette.textMuted,
    marginTop: 4,
    maxWidth: 260,
    lineHeight: 20,
  },
  searchCardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.primaryFixed,
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: palette.surfaceBorder,
    borderRadius: 16,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: palette.background,
    ...typography.body,
    color: palette.text,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: palette.surfaceBorder,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: palette.surfaceLow,
  },
  filterChipActive: {
    borderColor: palette.primaryContainer,
    backgroundColor: palette.primaryFixed,
  },
  filterChipText: {
    ...typography.caption,
    color: palette.textMuted,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: palette.primary,
  },
  loadingState: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.body,
    color: palette.textMuted,
  },
  resultsCount: {
    ...typography.caption,
    color: palette.textMuted,
    marginBottom: spacing.sm,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  card: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: palette.surface,
    borderColor: palette.surfaceBorder,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  facilityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  facilityIdentity: {
    flexDirection: "row",
    gap: spacing.sm,
    flex: 1,
  },
  facilityIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: palette.secondaryFixed,
    alignItems: "center",
    justifyContent: "center",
  },
  facilityTitleWrap: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    ...typography.h3,
    color: palette.text,
  },
  facilityLocation: {
    ...typography.body,
    color: palette.textMuted,
    lineHeight: 20,
  },
  typeBadge: {
    ...typography.caption,
    color: palette.primary,
    backgroundColor: palette.primaryFixed,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    overflow: "hidden",
    fontWeight: "700",
  },
  cardBody: {
    ...typography.body,
    color: palette.text,
  },
  phoneText: {
    ...typography.body,
    color: palette.primaryContainer,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  metaBadge: {
    ...typography.caption,
    color: palette.textMuted,
    borderWidth: 1,
    borderColor: palette.surfaceBorder,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: palette.surfaceLow,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  actionButton: {
    minWidth: 110,
    borderRadius: 14,
  },
  cardActions: {
    marginTop: spacing.sm,
  },
});

export default FacilityFinderScreen;
