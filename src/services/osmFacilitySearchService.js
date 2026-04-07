const DEFAULT_CENTER = { latitude: 9.03, longitude: 38.74 };
const DEFAULT_RADIUS_METERS = 12000;

const FILTER_SELECTORS = {
  all: [
    '["amenity"="hospital"]',
    '["amenity"="clinic"]',
    '["amenity"="doctors"]',
    '["healthcare"="hospital"]',
    '["healthcare"="clinic"]',
    '["healthcare"="centre"]',
    '["healthcare"="doctor"]',
  ],
  hospital: [
    '["amenity"="hospital"]',
    '["healthcare"="hospital"]',
  ],
  health_center: [
    '["healthcare"="centre"]',
    '["name"~"health center",i]',
    '["name"~"health centre",i]',
  ],
  clinic: [
    '["amenity"="clinic"]',
    '["healthcare"="clinic"]',
    '["amenity"="doctors"]',
    '["healthcare"="doctor"]',
  ],
  specialized: [
    '["name"~"special",i]',
    '["healthcare:speciality"]',
    '["healthcare:specialty"]',
  ],
};

const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const getCenter = (location) => location || DEFAULT_CENTER;

const buildOverpassQuery = ({ filterType, location, radiusMeters }) => {
  const center = getCenter(location);
  const radius = Math.max(
    3000,
    Math.min(25000, Number(radiusMeters) || DEFAULT_RADIUS_METERS),
  );
  const selectors = FILTER_SELECTORS[filterType] || FILTER_SELECTORS.all;

  const parts = selectors.flatMap((selector) => [
    `node(around:${radius},${center.latitude},${center.longitude})${selector};`,
    `way(around:${radius},${center.latitude},${center.longitude})${selector};`,
    `relation(around:${radius},${center.latitude},${center.longitude})${selector};`,
  ]);

  return `[out:json][timeout:25];
(
${parts.join("\n")}
);
out center tags;`;
};

const matchesQuery = (entry, query) => {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  if (!normalizedQuery) return true;

  const haystack = [
    entry?.tags?.name,
    entry?.tags?.["name:en"],
    entry?.tags?.operator,
    entry?.tags?.brand,
    entry?.tags?.amenity,
    entry?.tags?.healthcare,
    entry?.tags?.["addr:city"],
    entry?.tags?.["addr:suburb"],
    entry?.tags?.["addr:street"],
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
};

const inferFacilityType = (entry) => {
  const raw = [
    entry?.tags?.amenity,
    entry?.tags?.healthcare,
    entry?.tags?.["healthcare:speciality"],
    entry?.tags?.["healthcare:specialty"],
    entry?.tags?.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    raw.includes("health center") ||
    raw.includes("health centre") ||
    raw.includes("centre")
  ) {
    return "health_center";
  }
  if (raw.includes("special")) return "specialized";
  if (raw.includes("hospital")) return "hospital";
  if (raw.includes("clinic") || raw.includes("doctor")) return "clinic";
  return "clinic";
};

const buildAddress = (entry) => {
  const tags = entry?.tags || {};
  return [
    tags["addr:street"],
    tags["addr:suburb"],
    tags["addr:city"],
    tags["addr:state"],
  ]
    .filter(Boolean)
    .join(", ");
};

const normalizeWebsite = (entry) =>
  entry?.tags?.website ||
  entry?.tags?.["contact:website"] ||
  entry?.tags?.url ||
  "";

const normalizeImageUrl = (entry) =>
  entry?.tags?.image ||
  entry?.tags?.["contact:image"] ||
  "";

const dedupeEntries = (entries) => {
  const seen = new Set();

  return entries.filter((entry) => {
    const latitude = toNumber(entry?.lat ?? entry?.center?.lat);
    const longitude = toNumber(entry?.lon ?? entry?.center?.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;

    const key = `${String(entry?.tags?.name || "")
      .trim()
      .toLowerCase()}|${latitude.toFixed(4)}|${longitude.toFixed(4)}`;
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

export const searchOsmFacilities = async ({
  query,
  filterType = "all",
  location,
  limit = 36,
  radiusMeters = DEFAULT_RADIUS_METERS,
}) => {
  const overpassQuery = buildOverpassQuery({
    filterType,
    location,
    radiusMeters,
  });

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "text/plain;charset=UTF-8",
    },
    body: overpassQuery,
  });

  if (!response.ok) {
    throw new Error(`OpenStreetMap search failed (${response.status}).`);
  }

  const payload = await response.json();
  const elements = Array.isArray(payload?.elements) ? payload.elements : [];

  return dedupeEntries(elements)
    .filter((entry) => matchesQuery(entry, query))
    .slice(0, limit);
};

export const normalizeOsmFacility = (entry) => {
  const latitude = toNumber(entry?.lat ?? entry?.center?.lat);
  const longitude = toNumber(entry?.lon ?? entry?.center?.lon);
  const address = buildAddress(entry);
  const name =
    entry?.tags?.name ||
    entry?.tags?.["name:en"] ||
    entry?.tags?.operator ||
    "Nearby facility";

  return {
    id: `osm-${entry?.type || "node"}-${entry?.id}`,
    source: "osm",
    connected: false,
    bookable: false,
    publicListing: true,
    name,
    address: address || name,
    location: address || name,
    phone_number: entry?.tags?.phone || entry?.tags?.["contact:phone"] || "",
    website_url: normalizeWebsite(entry),
    email: entry?.tags?.email || entry?.tags?.["contact:email"] || "",
    operator_name: entry?.tags?.operator || "",
    opening_hours: entry?.tags?.opening_hours || "",
    image_url: normalizeImageUrl(entry),
    emergency_service:
      entry?.tags?.emergency === "yes" || entry?.tags?.["healthcare:emergency"] === "yes",
    wheelchair_access:
      entry?.tags?.wheelchair === "yes"
        ? "Wheelchair access"
        : entry?.tags?.wheelchair === "limited"
          ? "Limited wheelchair access"
          : "",
    accepts_walk_ins: false,
    facility_type: inferFacilityType(entry),
    coordinates:
      Number.isFinite(latitude) && Number.isFinite(longitude)
        ? { latitude, longitude }
        : null,
    raw: entry,
  };
};
