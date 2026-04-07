import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { patientPortalPalette as palette } from "../../theme/patientPortal";
import { radius, spacing, typography } from "../../theme/tokens";

const DEFAULT_CENTER = { latitude: 9.03, longitude: 38.74 };

let leafletPromise = null;

const loadLeaflet = async () => {
  if (Platform.OS !== "web") {
    throw new Error("Embedded OpenStreetMap is only available on web right now.");
  }

  if (globalThis.L?.map) return globalThis.L;
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise((resolve, reject) => {
    const existingCss = document.getElementById("leaflet-css");
    if (!existingCss) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const existingScript = document.getElementById("leaflet-js");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(globalThis.L));
      existingScript.addEventListener("error", () =>
        reject(new Error("Failed to load OpenStreetMap map assets.")),
      );
      return;
    }

    const script = document.createElement("script");
    script.id = "leaflet-js";
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => {
      if (globalThis.L?.map) resolve(globalThis.L);
      else reject(new Error("Leaflet loaded without map support."));
    };
    script.onerror = () =>
      reject(new Error("Failed to load OpenStreetMap map assets."));
    document.body.appendChild(script);
  });

  return leafletPromise;
};

const getFacilityMarkerColor = (facility) => {
  const type = String(facility?.facility_type || "").toLowerCase();
  if (type === "hospital") return "#8b4500";
  if (type === "health_center") return "#1260a5";
  if (type === "clinic") return "#2c694e";
  if (type === "specialized") return "#7c3aed";
  return "#2c694e";
};

const createDivIcon = (L, facility, selected = false) => {
  const fillColor = getFacilityMarkerColor(facility);
  const isPublicListing = facility?.source === "osm";
  const ringColor = isPublicListing ? "#ffffff" : "#E8F1FF";
  const borderStyle = isPublicListing ? "dashed" : "solid";
  const size = selected ? 22 : 18;

  return (
  L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;
      height:${size}px;
      border-radius:999px;
      background:${fillColor};
      border:3px ${borderStyle} ${ringColor};
      box-shadow:${selected ? "0 0 0 4px rgba(0,66,119,0.16), 0 4px 12px rgba(0,0,0,0.18)" : "0 4px 12px rgba(0,0,0,0.18)"};
      opacity:${isPublicListing ? "0.88" : "1"};
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
  );
};

const createUserLocationIcon = (L) =>
  L.divIcon({
    className: "",
    html: `<div style="position:relative;width:28px;height:36px;">
      <div style="
        position:absolute;
        top:0;
        left:4px;
        width:20px;
        height:20px;
        border-radius:999px;
        background:#004277;
        border:3px solid white;
        box-shadow:0 4px 12px rgba(0,0,0,0.22);
      "></div>
      <div style="
        position:absolute;
        top:18px;
        left:11px;
        width:0;
        height:0;
        border-left:7px solid transparent;
        border-right:7px solid transparent;
        border-top:12px solid #004277;
        filter:drop-shadow(0 2px 4px rgba(0,0,0,0.18));
      "></div>
    </div>`,
    iconSize: [28, 36],
    iconAnchor: [14, 34],
    popupAnchor: [0, -28],
  });

const OpenStreetMapView = ({
  facilities,
  userLocation,
  selectedFacilityId,
  onSelectFacility,
}) => {
  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const layerGroupRef = React.useRef(null);

  React.useEffect(() => {
    if (Platform.OS !== "web") return undefined;
    let active = true;

    const initMap = async () => {
      try {
        const L = await loadLeaflet();
        if (!active || !mapRef.current || mapInstanceRef.current) return;

        const center = userLocation || DEFAULT_CENTER;
        const map = L.map(mapRef.current).setView(
          [center.latitude, center.longitude],
          userLocation ? 13 : 11,
        );

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);

        mapInstanceRef.current = map;
        layerGroupRef.current = L.layerGroup().addTo(map);
      } catch {
        // Fallback below
      }
    };

    initMap();

    return () => {
      active = false;
      const layerGroup = layerGroupRef.current;
      const map = mapInstanceRef.current;

      layerGroupRef.current = null;
      mapInstanceRef.current = null;

      try {
        layerGroup?.clearLayers?.();
      } catch {
        // Ignore teardown issues from already-detached layers.
      }

      try {
        map?.remove?.();
      } catch {
        // Ignore teardown issues during fast remounts.
      }
    };
  }, []);

  React.useEffect(() => {
    if (Platform.OS !== "web") return;
    const L = globalThis.L;
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!L || !map || !layerGroup) return;

    layerGroup.clearLayers();
    const bounds = [];

    if (userLocation) {
      const userMarker = L.marker(
        [userLocation.latitude, userLocation.longitude],
        { icon: createUserLocationIcon(L) },
      ).bindPopup("Your location");
      layerGroup.addLayer(userMarker);
      bounds.push([userLocation.latitude, userLocation.longitude]);
    }

    facilities.forEach((facility) => {
      if (!facility?.coordinates) return;

      const marker = L.marker(
        [facility.coordinates.latitude, facility.coordinates.longitude],
        {
          icon: createDivIcon(L, facility, facility.id === selectedFacilityId),
        },
      );
      marker.on("click", () => onSelectFacility?.(facility));
      marker.bindPopup(facility.name || "Facility");
      layerGroup.addLayer(marker);
      bounds.push([facility.coordinates.latitude, facility.coordinates.longitude]);
    });

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [36, 36] });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], userLocation ? 13 : 11);
    } else {
      map.setView(
        [DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude],
        11,
      );
    }
  }, [facilities, onSelectFacility, selectedFacilityId, userLocation]);

  if (Platform.OS !== "web") {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Embedded map is available on web</Text>
        <Text style={styles.fallbackBody}>
          Native map support can plug into this same facility dataset next.
        </Text>
      </View>
    );
  }

  return React.createElement("div", {
    ref: mapRef,
    style: styles.webMap,
  });
};

const styles = StyleSheet.create({
  fallback: {
    minHeight: 240,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.surfaceBorder,
    backgroundColor: palette.surfaceLow,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.sm,
  },
  fallbackTitle: {
    ...typography.h3,
    color: palette.text,
    textAlign: "center",
  },
  fallbackBody: {
    ...typography.body,
    color: palette.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  webMap: {
    width: "100%",
    height: 460,
    borderRadius: 20,
    overflow: "hidden",
  },
});

export default OpenStreetMapView;
