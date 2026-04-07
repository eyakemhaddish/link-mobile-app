import { api } from "../lib/api";

const toIsoDateTime = (value) => {
    if (!value) return undefined;

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
    }

    const rawValue = String(value).trim();
    if (!rawValue) return undefined;
    if (rawValue.includes("T")) return rawValue;

    const parsed = new Date(`${rawValue}T00:00:00.000Z`);
    return Number.isNaN(parsed.getTime()) ? rawValue : parsed.toISOString();
};

const toStringArray = (value) => {
    if (Array.isArray(value)) {
        return value
            .map((entry) => String(entry || "").trim())
            .filter(Boolean);
    }

    if (typeof value === "string") {
        return value
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean);
    }

    return [];
};

const pickFirstString = (...values) => {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) return value.trim();
    }
    return null;
};

const extractUploadedFileUrl = (response) => {
    if (!response || typeof response !== "object") return null;

    return pickFirstString(
        response.file_url,
        response.fileUrl,
        response.url,
        response.location,
        response.path,
        response?.data?.file_url,
        response?.data?.fileUrl,
        response?.data?.url,
        response?.result?.file_url,
        response?.result?.fileUrl,
        response?.result?.url
    );
};

const normalizeAppointment = (appointment) => {
    const source = appointment && typeof appointment === "object" ? appointment : {};
    const facility = source.facilities || source.facility || null;

    return {
        ...source,
        facility,
        facilities: facility,
    };
};

const normalizeAppointmentsResponse = (response) => {
    const source = response && typeof response === "object" ? response : {};
    const rawAppointments = Array.isArray(source.appointments)
        ? source.appointments
        : Array.isArray(source.items)
            ? source.items
            : [];

    const appointments = rawAppointments.map(normalizeAppointment);

    return {
        ...source,
        appointments,
        items: appointments,
    };
};

const normalizeActiveVisitPayload = (response) => {
    const source = response && typeof response === "object" ? response : {};
    const patient = source.patient || source.patient_profile || null;
    const rawActiveVisits = Array.isArray(source.activeVisits)
        ? source.activeVisits
        : Array.isArray(source.active_visits)
            ? source.active_visits
            : Array.isArray(source.visits)
                ? source.visits
                : source.activeVisit || source.active_visit
                    ? [source.activeVisit || source.active_visit]
                    : [];

    const activeVisits = rawActiveVisits
        .filter((entry) => entry && typeof entry === "object")
        .map((rawActiveVisit) => ({
            ...rawActiveVisit,
            journey_timeline: Array.isArray(rawActiveVisit.journey_timeline)
                ? rawActiveVisit.journey_timeline
                : Array.isArray(rawActiveVisit.journeyTimeline)
                    ? rawActiveVisit.journeyTimeline
                    : [],
            current_journey_stage:
                rawActiveVisit.current_journey_stage ||
                rawActiveVisit.currentJourneyStage ||
                rawActiveVisit.status ||
                "registered",
        }));
    const activeVisit = activeVisits[0] || null;

    return {
        ...source,
        patient,
        activeVisits,
        active_visits: activeVisits,
        activeVisit: activeVisit,
        active_visit: activeVisit,
    };
};

const normalizeVisit = (visit) => {
    const source = visit && typeof visit === "object" ? visit : {};

    return {
        ...source,
        orders: source.orders || {
            lab: source.lab_orders || source.labOrders || [],
            imaging: source.imaging_orders || source.imagingOrders || [],
            medication: source.medication_orders || source.medicationOrders || [],
        },
    };
};

const normalizeVisitHistoryPayload = (response) => {
    const source = response && typeof response === "object" ? response : {};
    const rawVisits = Array.isArray(source.visits)
        ? source.visits
        : Array.isArray(source.items)
            ? source.items
            : [];
    const visits = rawVisits.map(normalizeVisit);

    return {
        ...source,
        visits,
        items: visits,
    };
};

const normalizeVisitDetailsPayload = (response) => {
    const source = response && typeof response === "object" ? response : {};
    const rawVisit = source.visit || source.data || source.result || source;

    return {
        ...source,
        visit: normalizeVisit(rawVisit),
    };
};

const normalizePatientFeedItem = (item) => {
    const source = item && typeof item === "object" ? item : {};

    return {
        ...source,
        id: source.id || null,
        patient_id: source.patient_id || source.patientId || null,
        visit_id: source.visit_id || source.visitId || null,
        facility_id: source.facility_id || source.facilityId || null,
        facility_name: source.facility_name || source.facilityName || "",
        resource_type: source.resource_type || source.resourceType || "",
        resource_id: source.resource_id || source.resourceId || "",
        event_type: source.event_type || source.eventType || "",
        status: source.status || "",
        title: source.title || "",
        description: source.description || "",
        priority: source.priority || "medium",
        occurred_at: source.occurred_at || source.occurredAt || null,
        updated_at: source.updated_at || source.updatedAt || null,
        expires_at: source.expires_at || source.expiresAt || null,
        metadata: source.metadata && typeof source.metadata === "object" ? source.metadata : {},
    };
};

const normalizePatientFeedResponse = (response) => {
    const source = response && typeof response === "object" ? response : {};
    const rawItems = Array.isArray(source.items) ? source.items : [];
    const items = rawItems.map(normalizePatientFeedItem);

    return {
        ...source,
        items,
        next_cursor: source.next_cursor || source.nextCursor || null,
        server_time: source.server_time || source.serverTime || null,
    };
};

/**
 * Fetch the active visit for the authenticated patient
 */
export const getActiveVisit = async () => {
    try {
        const response = await api.get("/patient-portal/visits/active");
        return normalizeActiveVisitPayload(response);
    } catch (error) {
        console.error("Failed to fetch active visit:", error);
        throw error;
    }
};

/**
 * Fetch dashboard statistics for the authenticated patient
 */
export const getPatientStats = async () => {
    try {
        const response = await api.get("/mobile/patient/stats");
        return response;
    } catch (error) {
        console.error("Failed to fetch patient stats:", error);
        throw error;
    }
};

/**
 * Fetch visit history for the authenticated patient
 */
export const getVisitHistory = async (limit = 10) => {
    try {
        const response = await api.get(`/patient-portal/visits/history?limit=${limit}`);
        return normalizeVisitHistoryPayload(response);
    } catch (error) {
        console.error("Failed to fetch visit history:", error);
        throw error;
    }
};

/**
 * Fetch synced health records derived from real Link visits
 */
export const getSyncedRecords = async (limit = 80) => {
    try {
        const response = await api.get(`/mobile/patient/records?limit=${limit}`);
        return response;
    } catch (error) {
        console.error("Failed to fetch synced records:", error);
        throw error;
    }
};

/**
 * Fetch complete visit details
 */
export const getVisitDetails = async (visitId) => {
    try {
        const response = await api.get(`/patient-portal/visits/${visitId}`);
        return normalizeVisitDetailsPayload(response);
    } catch (error) {
        console.error("Failed to fetch visit details:", error);
        throw error;
    }
};

export const getPatientRealtimeFeed = async (options = {}) => {
    try {
        const params = [];
        if (options?.since) params.push(`since=${encodeURIComponent(options.since)}`);
        const path = params.length
            ? `/patient-portal/feed?${params.join("&")}`
            : "/patient-portal/feed";

        const response = await api.get(path);
        return normalizePatientFeedResponse(response);
    } catch (error) {
        console.error("Failed to fetch patient realtime feed:", error);
        throw error;
    }
};

// ── Appointments ──────────────────────────────────────────────────────────

export const getFacilities = async () => {
    try {
        const response = await api.get("/patient-portal/facilities");
        return response;
    } catch (error) {
        console.error("Failed to fetch facilities:", error);
        throw error;
    }
};

export const getPublicDirectoryFacilities = async (options = {}) => {
    try {
        const params = [];
        if (options.search) params.push(`search=${encodeURIComponent(options.search)}`);
        if (options.type && options.type !== "all") params.push(`type=${encodeURIComponent(options.type)}`);
        if (options.limit) params.push(`limit=${encodeURIComponent(options.limit)}`);

        const path = params.length
            ? `/facilities/public?${params.join("&")}`
            : "/facilities/public";

        const response = await api.get(path, { auth: false });
        return response;
    } catch (error) {
        console.error("Failed to fetch public facilities:", error);
        throw error;
    }
};

export const getAppointments = async () => {
    try {
        const response = await api.get("/patient-portal/appointments");
        return normalizeAppointmentsResponse(response);
    } catch (error) {
        console.error("Failed to fetch appointments:", error);
        throw error;
    }
};

export const createAppointment = async (data) => {
    try {
        const payload = {
            facility_id: data?.facility_id || data?.facilityId,
            requested_date: toIsoDateTime(data?.requested_date || data?.requestedDate),
            requested_time_slot: data?.requested_time_slot || data?.requestedTimeSlot,
            reason: data?.reason,
            notes: data?.notes,
        };

        const response = await api.post("/patient-portal/appointments", payload);
        return response;
    } catch (error) {
        console.error("Failed to create appointment:", error);
        throw error;
    }
};

export const logSymptomCheck = async (data) => {
    try {
        const symptomData = data?.symptom_data || data?.symptomData || {};
        const payload = {
            symptom_data: {
                symptoms: symptomData?.symptoms || toStringArray(symptomData?.userInput),
                notes:
                    symptomData?.notes ||
                    data?.notes ||
                    symptomData?.userInput ||
                    undefined,
            },
            urgency_level: data?.urgency_level || data?.urgencyLevel,
            recommendations: data?.recommendations,
        };

        const response = await api.post("/patient-portal/symptom-logs", payload);
        return response;
    } catch (error) {
        console.error("Failed to log symptom check:", error);
        throw error;
    }
};

// ── Consent Management ───────────────────────────────────────────────────

export const grantConsent = async (data) => {
    try {
        const response = await api.post("/patient-portal/consents/grant", data);
        return response;
    } catch (error) {
        console.error("Failed to grant consent:", error);
        throw error;
    }
};

export const revokeConsent = async (data) => {
    try {
        const response = await api.post("/patient-portal/consents/revoke", data);
        return response;
    } catch (error) {
        console.error("Failed to revoke consent:", error);
        throw error;
    }
};

export const getConsentHistory = async (facilityId, consentType) => {
    try {
        let path = "/patient-portal/consents/history";
        const params = [];
        if (facilityId) params.push(`facilityId=${facilityId}`);
        if (consentType) params.push(`consentType=${consentType}`);
        if (params.length) path += `?${params.join("&")}`;
        const response = await api.get(path);
        return response;
    } catch (error) {
        console.error("Failed to fetch consent history:", error);
        throw error;
    }
};

// ── Health Records / Documents ───────────────────────────────────────────

export const getDocuments = async () => {
    try {
        const response = await api.get("/patient-portal/documents");
        return response;
    } catch (error) {
        console.error("Failed to fetch documents:", error);
        throw error;
    }
};

export const uploadDocumentFile = async (file) => {
    try {
        if (!file?.uri) {
            throw new Error("File URI is required for upload.");
        }

        const fileName =
            file?.name ||
            file?.fileName ||
            `document-${Date.now()}`;

        const formData = new FormData();
        const webFile = file?.webFile || file?.file || null;
        const nativeFilePart = {
            uri: file.uri,
            type: file?.mimeType || file?.type || "application/octet-stream",
            name: fileName,
        };

        // ASP.NET endpoint validation reports `file` as required; send lower-case key.
        formData.append("file", webFile || nativeFilePart);
        formData.append("fileName", fileName);

        const response = await api.post("/patient-portal/documents/upload", formData);
        const fileUrl = extractUploadedFileUrl(response);

        if (!fileUrl) {
            throw new Error("Upload succeeded but file URL was not returned.");
        }

        return {
            file_url: fileUrl,
            raw: response,
        };
    } catch (error) {
        console.error("Failed to upload document file:", error);
        throw error;
    }
};

export const uploadDocument = async (formData) => {
    try {
        const payload = {
            document_type: formData?.document_type || formData?.documentType,
            provider_name: formData?.provider_name || formData?.providerName,
            document_date: toIsoDateTime(formData?.document_date || formData?.documentDate),
            description: formData?.description,
            tags: toStringArray(formData?.tags),
            file_url: formData?.file_url || formData?.fileUrl,
        };

        const response = await api.post("/patient-portal/documents", payload);
        return response;
    } catch (error) {
        console.error("Failed to upload document:", error);
        throw error;
    }
};

export const deleteDocument = async (documentId) => {
    try {
        const response = await api.delete(`/patient-portal/documents/${documentId}`);
        return response;
    } catch (error) {
        console.error("Failed to delete document:", error);
        throw error;
    }
};
