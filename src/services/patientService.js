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

const normalizeActiveVisitPayload = (response) => {
    const source = response && typeof response === "object" ? response : {};
    const patient = source.patient || source.patient_profile || null;
    const rawActiveVisit = source.activeVisit || source.active_visit || null;

    if (!rawActiveVisit) {
        return {
            ...source,
            patient,
            activeVisit: null,
            active_visit: null,
        };
    }

    const normalizedActiveVisit = {
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
    };

    return {
        ...source,
        patient,
        activeVisit: normalizedActiveVisit,
        active_visit: normalizedActiveVisit,
    };
};

/**
 * Fetch the active visit for the authenticated patient
 */
export const getActiveVisit = async () => {
    try {
        const response = await api.get("/mobile/patient/active-visit");
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
        const response = await api.get(`/mobile/patient/visit-history?limit=${limit}`);
        return response;
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
        const response = await api.get(`/visits/${visitId}`);
        return response;
    } catch (error) {
        console.error("Failed to fetch visit details:", error);
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
        return response;
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
