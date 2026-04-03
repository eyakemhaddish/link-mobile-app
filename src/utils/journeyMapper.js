/**
 * Map backend journey stages to mobile UI journey steps
 */

const STAGE_LABELS = {
  registered: "Registration",
  at_triage: "Triage",
  vitals_taken: "Vitals Capture",
  with_doctor: "Consultation",
  at_lab: "Lab / Diagnostic",
  at_imaging: "Imaging",
  at_pharmacy: "Pharmacy",
  paying_consultation: "Paying Consultation",
  paying_diagnosis: "Paying Diagnosis",
  paying_pharmacy: "Paying Pharmacy",
  completed: "Completed",
};

const STAGE_ORDER = [
  "registered",
  "at_triage",
  "vitals_taken",
  "with_doctor",
  "at_lab",
  "at_imaging",
  "at_pharmacy",
  "completed",
];

const STATUS_MAP = {
  registered: "registered",
  triage: "at_triage",
  at_triage: "at_triage",
  vitals_taken: "vitals_taken",
  doctor: "with_doctor",
  with_doctor: "with_doctor",
  lab: "at_lab",
  at_lab: "at_lab",
  procedure: "at_imaging", // map procedure/imaging to "at_imaging"
  imaging: "at_imaging",
  at_imaging: "at_imaging",
  pharmacy: "at_pharmacy",
  at_pharmacy: "at_pharmacy",
  paying_consultation: "paying_consultation",
  paying_diagnosis: "paying_diagnosis",
  paying_pharmacy: "paying_pharmacy",
  completed: "completed",
};

const normalizeStage = (stage) => {
  if (!stage) return null;
  const raw = String(stage).trim().toLowerCase();
  return STATUS_MAP[raw] || raw;
};

const humanizeStage = (stage) => {
  if (!stage) return "";
  return String(stage)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
};

const pickTimelineTimestamp = (entry) =>
  entry?.completed_at ||
  entry?.timestamp ||
  entry?.arrived_at ||
  entry?.created_at ||
  entry?.updated_at ||
  null;

const parseDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateTime = (value) => {
  if (!value) return "--";
  const parsed = parseDate(value);
  if (!parsed) return String(value);
  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getTimelineEntries = (visit) => {
  const rawTimeline = Array.isArray(visit?.journey_timeline)
    ? visit.journey_timeline
    : Array.isArray(visit?.journeyTimeline)
      ? visit.journeyTimeline
      : [];

  return rawTimeline
    .map((entry, index) => {
      const stage = normalizeStage(
        entry?.stage || entry?.status || entry?.name,
      );
      if (!stage) return null;

      const timestamp = pickTimelineTimestamp(entry);
      const parsed = parseDate(timestamp);

      return {
        stage,
        timestamp,
        parsedTime: parsed ? parsed.getTime() : null,
        index,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.parsedTime == null && b.parsedTime == null)
        return a.index - b.index;
      if (a.parsedTime == null) return 1;
      if (b.parsedTime == null) return -1;
      return a.parsedTime - b.parsedTime;
    });
};

/**
 * Convert backend visit data to mobile journey steps
 * @param {Object} visit - Visit object from backend
 * @returns {Array} Array of journey steps for mobile UI
 */
export const mapVisitToJourneySteps = (visit) => {
  if (!visit) return [];

  const timelineEntries = getTimelineEntries(visit);
  if (timelineEntries.length > 0) {
    const latestTimelineEntry = timelineEntries[timelineEntries.length - 1];
    const isVisitCompleted =
      latestTimelineEntry?.stage === "completed" ||
      normalizeStage(visit.status) === "completed";

    return timelineEntries.map((entry, index) => {
      const isLatest = index === timelineEntries.length - 1;
      return {
        id: index + 1,
        label: getStageLabel(entry.stage),
        time: formatDateTime(entry.timestamp),
        status: isLatest && !isVisitCompleted ? "active" : "completed",
        stage: entry.stage,
        timestamp: entry.timestamp || null,
      };
    });
  }

  const fallbackStage = normalizeStage(
    visit.current_journey_stage || visit.status || "registered",
  );
  const currentStage = fallbackStage || "registered";
  const currentStageIndex = STAGE_ORDER.indexOf(currentStage);
  const isVisitCompleted =
    currentStage === "completed" ||
    normalizeStage(visit.status) === "completed";

  const steps = [];
  let stepId = 1;

  STAGE_ORDER.forEach((stage, index) => {
    let status = "pending";
    if (currentStageIndex >= 0) {
      if (index < currentStageIndex) status = "completed";
      else if (index === currentStageIndex && !isVisitCompleted)
        status = "active";
    }

    let time = "--";
    if (status === "active") {
      time = "In Progress";
    }

    steps.push({
      id: stepId++,
      label: STAGE_LABELS[stage] || humanizeStage(stage),
      time,
      status,
      stage,
      timestamp: null,
    });
  });

  // Unknown current stage: append it so the user still sees what's happening.
  if (currentStageIndex < 0 && currentStage) {
    steps.push({
      id: stepId++,
      label: getStageLabel(currentStage),
      time: "In Progress",
      status: isVisitCompleted ? "completed" : "active",
      stage: currentStage,
      timestamp: null,
    });
  }

  return steps;
};

/**
 * Get current journey stage label
 * @param {string} stage - Backend stage identifier
 * @returns {string} User-friendly stage label
 */
export const getStageLabel = (stage) => {
  const normalized = normalizeStage(stage);
  return STAGE_LABELS[normalized] || humanizeStage(normalized || stage);
};

/**
 * Format visit data for mobile display
 * @param {Object} visit - Visit object from backend
 * @returns {Object} Formatted visit data
 */
export const formatVisitForDisplay = (visit) => {
  const timelineEntries = getTimelineEntries(visit);
  const latestTimelineEntry =
    timelineEntries.length > 0
      ? timelineEntries[timelineEntries.length - 1]
      : null;
  const fallbackStage = normalizeStage(
    visit.current_journey_stage || visit.status || "registered",
  );
  const currentStage =
    latestTimelineEntry?.stage || fallbackStage || "registered";
  const stageUpdatedAt =
    latestTimelineEntry?.timestamp ||
    visit.updated_at ||
    visit.created_at ||
    visit.visit_date ||
    null;

  return {
    id: visit.id,
    visitDate: visit.visit_date,
    reason: visit.reason,
    provider: visit.provider || "Staff",
    currentStage: getStageLabel(currentStage),
    currentStageRaw: currentStage,
    currentStageUpdatedAt: stageUpdatedAt,
    currentStageUpdatedLabel: formatDateTime(stageUpdatedAt),
    urgency: visit.triage_urgency,
    hasTimeline: timelineEntries.length > 0,
    journeySteps: mapVisitToJourneySteps({
      ...visit,
      current_journey_stage: currentStage,
    }),
  };
};

/**
 * Get summary of visit orders
 * @param {Object} orders - Orders object from visit
 * @returns {Object} Order summary
 */
export const getOrdersSummary = (orders) => {
  if (!orders) return { total: 0, pending: 0, completed: 0 };

  const allOrders = [
    ...(orders.lab || []),
    ...(orders.imaging || []),
    ...(orders.medication || []),
  ];

  return {
    total: allOrders.length,
    pending: allOrders.filter((o) => o.payment_status === "unpaid").length,
    completed: allOrders.filter((o) => o.payment_status === "paid").length,
  };
};
