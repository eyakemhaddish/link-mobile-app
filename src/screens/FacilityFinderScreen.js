import React from "react";
import {
  Image,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  TextInput,
  Linking,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import OpenStreetMapView from "../components/patient/OpenStreetMapView";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import HeroHeader from "../components/ui/HeroHeader";
import Screen from "../components/ui/Screen";
import { useToast } from "../context/ToastContext";
import {
  normalizeOsmFacility,
  searchOsmFacilities,
} from "../services/osmFacilitySearchService";
import {
  getFacilities,
  getPublicDirectoryFacilities,
} from "../services/patientService";
import { patientPortalPalette as palette } from "../theme/patientPortal";
import { colors, radius, spacing, typography } from "../theme/tokens";

const FACILITY_FILTERS = [
  { value: "all", label: "All" },
  { value: "hospital", label: "Hospitals" },
  { value: "health_center", label: "Health Centers" },
  { value: "clinic", label: "Clinics" },
  { value: "specialized", label: "Specialized" },
];

const VIEW_MODES = [
  { value: "list", label: "List" },
  { value: "map", label: "Map" },
];

const MAP_LEGEND = [
  { key: "hospital", label: "Hospital", color: "#8b4500" },
  { key: "health_center", label: "Health Center", color: "#1260a5" },
  { key: "clinic", label: "Clinic", color: "#2c694e" },
  { key: "specialized", label: "Specialized", color: "#7c3aed" },
];

const getFacilityTypeTheme = (facilityType) => {
  switch (String(facilityType || "").toLowerCase()) {
    case "hospital":
      return {
        color: "#8b4500",
        backgroundColor: "#ffdcc5",
        icon: "plus-square",
      };
    case "health_center":
      return {
        color: "#1260a5",
        backgroundColor: "#d3e4ff",
        icon: "crosshair",
      };
    case "clinic":
      return {
        color: "#2c694e",
        backgroundColor: "#b1f0ce",
        icon: "heart",
      };
    case "specialized":
      return {
        color: "#7c3aed",
        backgroundColor: "#ede9fe",
        icon: "star",
      };
    default:
      return {
        color: palette.primary,
        backgroundColor: palette.primaryFixed,
        icon: "map-pin",
      };
  }
};

const formatFacilityType = (value) => {
  if (!value) return "Facility";
  return String(value)
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const cleanUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
};

const getFacilityDetailRows = (facility) =>
  [
    facility?.operator_name
      ? { key: "operator", icon: "briefcase", label: "Operator", value: facility.operator_name }
      : null,
    facility?.opening_hours
      ? { key: "hours", icon: "clock", label: "Hours", value: facility.opening_hours }
      : null,
    facility?.email
      ? { key: "email", icon: "mail", label: "Email", value: facility.email }
      : null,
    facility?.wheelchair_access
      ? { key: "access", icon: "navigation", label: "Access", value: facility.wheelchair_access }
      : null,
  ].filter(Boolean);

const pickCoordinate = (...values) => {
  for (const value of values) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return null;
};

const getCoordinates = (facility) => {
  const latitude = pickCoordinate(
    facility?.latitude,
    facility?.lat,
    facility?.location_lat,
    facility?.locationLat,
    facility?.coordinates?.latitude,
    facility?.coordinates?.lat,
  );
  const longitude = pickCoordinate(
    facility?.longitude,
    facility?.lng,
    facility?.lon,
    facility?.location_lng,
    facility?.locationLng,
    facility?.coordinates?.longitude,
    facility?.coordinates?.lng,
    facility?.coordinates?.lon,
  );

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return { latitude, longitude };
};

const toRadians = (value) => (value * Math.PI) / 180;

const getDistanceKm = (origin, destination) => {
  if (!origin || !destination) return null;

  const earthRadiusKm = 6371;
  const latDistance = toRadians(destination.latitude - origin.latitude);
  const lngDistance = toRadians(destination.longitude - origin.longitude);
  const a =
    Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
    Math.cos(toRadians(origin.latitude)) *
      Math.cos(toRadians(destination.latitude)) *
      Math.sin(lngDistance / 2) *
      Math.sin(lngDistance / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
};

const formatDistance = (distanceKm) => {
  if (!Number.isFinite(distanceKm)) return null;
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m away`;
  return `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km away`;
};

const createOpenStreetMapUrl = (facility) => {
  if (facility?.coordinates) {
    const { latitude, longitude } = facility.coordinates;
    return `https://www.openstreetmap.org/?mlat=${encodeURIComponent(
      latitude,
    )}&mlon=${encodeURIComponent(longitude)}#map=16/${encodeURIComponent(
      latitude,
    )}/${encodeURIComponent(longitude)}`;
  }

  const query = [facility?.name, facility?.address || facility?.location || ""]
    .filter(Boolean)
    .join(" ");
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`;
};

const areSameFacility = (left, right) => {
  const leftName = String(left?.name || "").trim().toLowerCase();
  const rightName = String(right?.name || "").trim().toLowerCase();
  if (!leftName || !rightName || leftName !== rightName) return false;

  const leftAddress = String(left?.address || left?.location || "")
    .trim()
    .toLowerCase();
  const rightAddress = String(right?.address || right?.location || "")
    .trim()
    .toLowerCase();
  if (leftAddress && rightAddress && leftAddress === rightAddress) return true;

  const distanceKm = getDistanceKm(left?.coordinates, right?.coordinates);
  return Number.isFinite(distanceKm) ? distanceKm < 0.2 : false;
};

const FacilityFinderScreen = ({ navigation }) => {
  const { showToast } = useToast();
  const [facilities, setFacilities] = React.useState([]);
  const [connectedFacilityIds, setConnectedFacilityIds] = React.useState(
    () => new Set(),
  );
  const [externalFacilities, setExternalFacilities] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [externalLoading, setExternalLoading] = React.useState(false);
  const [locationLoading, setLocationLoading] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterType, setFilterType] = React.useState("all");
  const [viewMode, setViewMode] = React.useState("list");
  const [userLocation, setUserLocation] = React.useState(null);
  const [selectedFacilityId, setSelectedFacilityId] = React.useState(null);

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
        const connectedFacilities = Array.isArray(
          connectedResult.value?.facilities,
        )
          ? connectedResult.value.facilities
          : [];
        setConnectedFacilityIds(
          new Set(connectedFacilities.map((facility) => facility.id)),
        );
      } else {
        setConnectedFacilityIds(new Set());
      }
    } catch (error) {
      setFacilities([]);
      setConnectedFacilityIds(new Set());
      showToast(error?.message || "Unable to load facilities.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  React.useEffect(() => {
    loadFacilities();
  }, [loadFacilities]);

  React.useEffect(() => {
    let active = true;

    const loadExternalFacilities = async () => {
      setExternalLoading(true);
      try {
        const results = await searchOsmFacilities({
          query: searchTerm,
          filterType,
          location: userLocation,
        });

        if (!active) return;
        setExternalFacilities(results.map(normalizeOsmFacility));
      } catch (error) {
        if (active) {
          setExternalFacilities([]);
          showToast(
            error?.message || "Unable to load nearby OpenStreetMap facilities.",
            "error",
          );
        }
      } finally {
        if (active) setExternalLoading(false);
      }
    };

    loadExternalFacilities();
    return () => {
      active = false;
    };
  }, [filterType, searchTerm, showToast, userLocation]);

  const requestLocation = React.useCallback(() => {
    const geolocation = globalThis?.navigator?.geolocation;
    if (!geolocation?.getCurrentPosition) {
      showToast("Location access is not available on this device yet.", "error");
      return;
    }

    setLocationLoading(true);
    geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationLoading(false);
      },
      () => {
        setLocationLoading(false);
        showToast("Unable to get your location right now.", "error");
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 300000,
      },
    );
  }, [showToast]);

  const discoveredFacilities = React.useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const normalizedLinkFacilities = facilities
      .map((facility) => {
        const coordinates = getCoordinates(facility);
        const distanceKm = getDistanceKm(userLocation, coordinates);

        return {
          ...facility,
          source: "link",
          connected: connectedFacilityIds.has(facility.id),
          bookable: true,
          coordinates,
          distance_km: distanceKm,
          distance_label: formatDistance(distanceKm),
        };
      })
      .filter((facility) => {
        if (filterType !== "all" && facility.facility_type !== filterType) {
          return false;
        }

        if (!query) return true;

        return [
          facility.name,
          facility.location,
          facility.address,
          facility.phone_number,
        ]
          .map((value) => String(value || "").toLowerCase())
          .some((value) => value.includes(query));
      });

    const mergedFacilities = [
      ...normalizedLinkFacilities,
      ...externalFacilities.filter(
        (externalFacility) =>
          !normalizedLinkFacilities.some((linkFacility) =>
            areSameFacility(linkFacility, externalFacility),
          ),
      ),
    ].map((facility) => {
      if (facility.distance_label) return facility;

      const distanceKm = getDistanceKm(userLocation, facility.coordinates);
      return {
        ...facility,
        distance_km: distanceKm,
        distance_label: formatDistance(distanceKm),
      };
    });

    return mergedFacilities.sort((left, right) => {
      if (left.connected !== right.connected) return left.connected ? -1 : 1;

      const leftDistance = Number.isFinite(left.distance_km)
        ? left.distance_km
        : Number.POSITIVE_INFINITY;
      const rightDistance = Number.isFinite(right.distance_km)
        ? right.distance_km
        : Number.POSITIVE_INFINITY;
      if (leftDistance !== rightDistance) return leftDistance - rightDistance;

      if (left.source !== right.source) return left.source === "link" ? -1 : 1;

      return String(left.name || "").localeCompare(String(right.name || ""));
    });
  }, [
    connectedFacilityIds,
    externalFacilities,
    facilities,
    filterType,
    searchTerm,
    userLocation,
  ]);

  const mappedFacilities = React.useMemo(
    () => discoveredFacilities.filter((facility) => facility.coordinates),
    [discoveredFacilities],
  );
  const mappedLinkFacilities = React.useMemo(
    () => mappedFacilities.filter((facility) => facility.source !== "osm").length,
    [mappedFacilities],
  );
  const mappedPublicFacilities = React.useMemo(
    () => mappedFacilities.filter((facility) => facility.source === "osm").length,
    [mappedFacilities],
  );

  const selectedFacility = React.useMemo(
    () =>
      discoveredFacilities.find((facility) => facility.id === selectedFacilityId) ||
      null,
    [discoveredFacilities, selectedFacilityId],
  );

  React.useEffect(() => {
    if (viewMode !== "map") return;
    if (!userLocation && !locationLoading) {
      requestLocation();
    }
  }, [locationLoading, requestLocation, userLocation, viewMode]);

  React.useEffect(() => {
    if (viewMode !== "map") return;
    if (selectedFacilityId) return;
    if (!mappedFacilities.length) return;

    setSelectedFacilityId(mappedFacilities[0].id);
  }, [mappedFacilities, selectedFacilityId, viewMode]);

  const handleDirections = React.useCallback((facility) => {
    Linking.openURL(createOpenStreetMapUrl(facility));
  }, []);

  const handleOpenWebsite = React.useCallback(async (facility) => {
    const url = cleanUrl(facility?.website_url);
    if (!url) return;
    await Linking.openURL(url);
  }, []);

  const handleCall = React.useCallback((phoneNumber) => {
    if (!phoneNumber) return;
    Linking.openURL(`tel:${phoneNumber}`);
  }, []);

  const handleBookAppointment = React.useCallback(
    (facility) => {
      if (!facility?.bookable) return;
      navigation.navigate("PatientAppointments", {
        startBooking: true,
        prefillFacilityId: facility.id,
        prefillFacilityName: facility.name,
      });
    },
    [navigation],
  );

  return (
    <Screen backgroundColor={palette.background}>
      <HeroHeader
        badge="Care directory"
        title="Find a clinic"
        subtitle="See Link facilities and nearby OpenStreetMap care locations on one map."
        style={styles.header}
      />

      <Card style={styles.searchCard}>
        <View style={styles.searchCardHeader}>
          <View>
            <Text style={styles.searchCardTitle}>Search by facility or location</Text>
          </View>
          <View style={styles.searchCardIconWrap}>
            <Feather name="map-pin" size={20} color={palette.primary} />
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
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.utilityRow}>
          <View style={styles.viewModeRow}>
            {VIEW_MODES.map((mode) => {
              const active = viewMode === mode.value;
              return (
                <Pressable
                  key={mode.value}
                  style={[styles.viewModeChip, active && styles.viewModeChipActive]}
                  onPress={() => setViewMode(mode.value)}
                >
                  <Text
                    style={[styles.viewModeText, active && styles.viewModeTextActive]}
                  >
                    {mode.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.locationButton} onPress={requestLocation}>
            {locationLoading ? (
              <ActivityIndicator size="small" color={palette.primary} />
            ) : (
              <>
                <Feather name="crosshair" size={15} color={palette.primary} />
                <Text style={styles.locationButtonText}>
                  {userLocation ? "Location on" : "Use my location"}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </Card>

      {loading || externalLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading facilities...</Text>
        </View>
      ) : null}

      {viewMode === "map" ? (
        <Card style={styles.mapCard}>
          <OpenStreetMapView
            facilities={mappedFacilities}
            userLocation={userLocation}
            selectedFacilityId={selectedFacilityId}
            onSelectFacility={(facility) => setSelectedFacilityId(facility.id)}
          />

          <View style={styles.mapStatusRow}>
            <Text style={styles.mapStatusText}>
              {userLocation
                ? ""
                : "Turn on location to show your position."}
            </Text>
            <Text style={styles.mapStatusText}>
              {mappedFacilities.length} of {discoveredFacilities.length} facilities can be placed on the map
            </Text>
            <Text style={styles.mapStatusText}>
              {mappedLinkFacilities} Link facilities • {mappedPublicFacilities} public facilities
            </Text>
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={styles.userLegendPin} />
              <Text style={styles.legendText}>You</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.linkLegendDot} />
              <Text style={styles.legendText}>Link facility</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.publicLegendDot} />
              <Text style={styles.legendText}>Public facility</Text>
            </View>
            {MAP_LEGEND.map((item) => (
              <View key={item.key} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>{item.label}</Text>
              </View>
            ))}
          </View>

          {selectedFacility ? (
            <View style={styles.selectedCard}>
              {selectedFacility.image_url ? (
                <Image
                  source={{ uri: cleanUrl(selectedFacility.image_url) }}
                  style={styles.facilityImage}
                  resizeMode="cover"
                />
              ) : null}
              <Text style={styles.selectedName}>{selectedFacility.name}</Text>
              <Text style={styles.selectedMeta}>
                {selectedFacility.address ||
                  selectedFacility.location ||
                  "Location details unavailable"}
              </Text>
              <View style={styles.metaRow}>
                <Text
                  style={[
                    styles.metaBadge,
                    {
                      color: getFacilityTypeTheme(selectedFacility.facility_type).color,
                      backgroundColor:
                        getFacilityTypeTheme(selectedFacility.facility_type)
                          .backgroundColor,
                    },
                  ]}
                >
                  {formatFacilityType(selectedFacility.facility_type)}
                </Text>
                {selectedFacility.distance_label ? (
                  <Text style={styles.metaBadge}>{selectedFacility.distance_label}</Text>
                ) : null}
                {selectedFacility.connected ? (
                  <Text style={styles.metaBadge}>Connected to your care team</Text>
                ) : null}
                {selectedFacility.source === "osm" ? (
                  <Text style={styles.metaBadge}>OpenStreetMap listing</Text>
                ) : null}
                {selectedFacility.emergency_service ? (
                  <Text style={styles.metaBadge}>Emergency service</Text>
                ) : null}
              </View>
              {getFacilityDetailRows(selectedFacility).map((row) => (
                <View key={row.key} style={styles.detailRow}>
                  <Feather name={row.icon} size={15} color={palette.primary} />
                  <Text style={styles.detailLabel}>{row.label}</Text>
                  <Text style={styles.detailValue}>{row.value}</Text>
                </View>
              ))}
              <View style={styles.actionsRow}>
                {selectedFacility.source !== "osm" ? (
                  <Button
                    title="Book appointment"
                    onPress={() => handleBookAppointment(selectedFacility)}
                    style={styles.actionButton}
                  />
                ) : null}
                <Button
                  title="Directions"
                  variant="secondary"
                  onPress={() => handleDirections(selectedFacility)}
                  style={styles.actionButton}
                />
                {selectedFacility.website_url ? (
                  <Button
                    title="Website"
                    variant="ghost"
                    onPress={() => handleOpenWebsite(selectedFacility)}
                    style={styles.actionButton}
                  />
                ) : null}
                {selectedFacility.phone_number ? (
                  <Button
                    title="Call"
                    variant="ghost"
                    onPress={() => handleCall(selectedFacility.phone_number)}
                    style={styles.actionButton}
                  />
                ) : null}
              </View>
            </View>
          ) : (
            <Text style={styles.mapHint}>
              Tap a marker to see facility actions and booking options.
            </Text>
          )}
        </Card>
      ) : null}

      <Text style={styles.resultsCount}>
        {discoveredFacilities.length}{" "}
        {discoveredFacilities.length === 1 ? "facility" : "facilities"} available
      </Text>

      {discoveredFacilities.length === 0 && !loading && !externalLoading ? (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>No matching facilities</Text>
          <Text style={styles.cardBody}>
            Try another search term, turn on location, or refresh the directory.
          </Text>
          <View style={styles.cardActions}>
            <Button
              title="Refresh directory"
              variant="secondary"
              onPress={loadFacilities}
            />
          </View>
        </Card>
      ) : (
        discoveredFacilities.map((facility) => (
          <Card style={styles.card} key={facility.id}>
            <View style={styles.facilityHeader}>
              <View style={styles.facilityIdentity}>
                <View
                  style={[
                    styles.facilityIcon,
                    {
                      backgroundColor: getFacilityTypeTheme(facility.facility_type)
                        .backgroundColor,
                    },
                  ]}
                >
                  <Feather
                    name={getFacilityTypeTheme(facility.facility_type).icon}
                    size={18}
                    color={getFacilityTypeTheme(facility.facility_type).color}
                  />
                </View>
                <View style={styles.facilityTitleWrap}>
                  <Text style={styles.cardTitle}>{facility.name}</Text>
                  <Text style={styles.facilityLocation}>
                    {facility.address ||
                      facility.location ||
                      "Location details unavailable"}
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.typeBadge,
                  {
                    color: getFacilityTypeTheme(facility.facility_type).color,
                    backgroundColor:
                      getFacilityTypeTheme(facility.facility_type).backgroundColor,
                  },
                ]}
              >
                {formatFacilityType(facility.facility_type)}
              </Text>
            </View>

            {facility.phone_number ? (
              <Pressable onPress={() => handleCall(facility.phone_number)}>
                <Text style={styles.phoneText}>{facility.phone_number}</Text>
              </Pressable>
            ) : null}
            {facility.image_url ? (
              <Image
                source={{ uri: cleanUrl(facility.image_url) }}
                style={styles.facilityImage}
                resizeMode="cover"
              />
            ) : null}

            <View style={styles.metaRow}>
              {facility.distance_label ? (
                <Text style={styles.metaBadge}>{facility.distance_label}</Text>
              ) : null}
              {facility.connected ? (
                <Text style={styles.metaBadge}>Connected to your care team</Text>
              ) : null}
              {facility.source === "osm" ? (
                <Text style={styles.metaBadge}>OpenStreetMap listing</Text>
              ) : null}
              {facility.emergency_service ? (
                <Text style={styles.metaBadge}>Emergency service</Text>
              ) : null}
              {facility.accepts_walk_ins ? (
                <Text style={styles.metaBadge}>Accepts walk-ins</Text>
              ) : null}
            </View>

            {getFacilityDetailRows(facility).map((row) => (
              <View key={row.key} style={styles.detailRow}>
                <Feather name={row.icon} size={15} color={palette.primary} />
                <Text style={styles.detailLabel}>{row.label}</Text>
                <Text style={styles.detailValue}>{row.value}</Text>
              </View>
            ))}

            <View style={styles.actionsRow}>
              {facility.source !== "osm" ? (
                <Button
                  title="Book appointment"
                  onPress={() => handleBookAppointment(facility)}
                  style={styles.actionButton}
                />
              ) : null}
              <Button
                title="Directions"
                variant="secondary"
                onPress={() => handleDirections(facility)}
                style={styles.actionButton}
              />
              {facility.website_url ? (
                <Button
                  title="Website"
                  variant="ghost"
                  onPress={() => handleOpenWebsite(facility)}
                  style={styles.actionButton}
                />
              ) : null}
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
  utilityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  viewModeRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  viewModeChip: {
    borderWidth: 1,
    borderColor: palette.surfaceBorder,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: palette.surfaceLow,
  },
  viewModeChipActive: {
    borderColor: palette.primary,
    backgroundColor: palette.primaryFixed,
  },
  viewModeText: {
    ...typography.caption,
    color: palette.textMuted,
    fontWeight: "700",
  },
  viewModeTextActive: {
    color: palette.primary,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: palette.surfaceLow,
    borderWidth: 1,
    borderColor: palette.surfaceBorder,
  },
  locationButtonText: {
    ...typography.caption,
    color: palette.primary,
    fontWeight: "700",
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
  mapCard: {
    gap: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: palette.surface,
    borderColor: palette.surfaceBorder,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  mapStatusRow: {
    gap: 4,
  },
  mapStatusText: {
    ...typography.caption,
    color: palette.textMuted,
    fontWeight: "700",
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  userLegendPin: {
    width: 12,
    height: 18,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 2,
    backgroundColor: "#004277",
    transform: [{ rotate: "45deg" }],
  },
  linkLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: palette.primary,
    borderWidth: 2,
    borderColor: "#E8F1FF",
  },
  publicLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: palette.primary,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    borderStyle: "dashed",
    opacity: 0.88,
  },
  legendText: {
    ...typography.caption,
    color: palette.textMuted,
    fontWeight: "700",
  },
  selectedCard: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  facilityImage: {
    width: "100%",
    height: 148,
    borderRadius: 16,
    backgroundColor: palette.surfaceLow,
    marginBottom: spacing.sm,
  },
  selectedName: {
    ...typography.h3,
    color: palette.text,
  },
  selectedMeta: {
    ...typography.body,
    color: palette.textMuted,
  },
  mapHint: {
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
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  detailLabel: {
    ...typography.caption,
    color: palette.textMuted,
    minWidth: 54,
    fontWeight: "700",
  },
  detailValue: {
    ...typography.body,
    color: palette.text,
    flex: 1,
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
