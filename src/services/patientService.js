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

const pickDisplayText = (...values) => {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) return value.trim();

        if (value && typeof value === "object") {
            const nested = pickFirstString(
                value.name,
                value.full_name,
                value.fullName,
                value.title,
                value.label,
                value.description,
                value.code
            );
            if (nested) return nested;
        }
    }

    return null;
};

const formatComplaintValue = (value) => {
    if (!value) return null;

    if (Array.isArray(value)) {
        const labels = value
            .map((entry) => {
                if (typeof entry === "string") return entry.trim();
                if (entry && typeof entry === "object") {
                    return pickFirstString(entry.label, entry.name, entry.description, entry.code);
                }
                return null;
            })
            .filter(Boolean);

        return labels.length ? labels.join(", ") : null;
    }

    if (typeof value === "string") {
        const raw = value.trim();
        if (!raw) return null;

        try {
            const parsed = JSON.parse(raw);
            if (parsed !== value) {
                const formatted = formatComplaintValue(parsed);
                if (formatted) return formatted;
            }
        } catch {
            // Not JSON; keep raw string as-is.
        }

        return raw;
    }

    if (value && typeof value === "object") {
        return pickDisplayText(value);
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

const getVisitStageCode = (visit) =>
    visit?.current_journey_stage ||
    visit?.currentJourneyStage ||
    visit?.current_stage?.code ||
    visit?.currentStage?.code ||
    visit?.current_stage_code ||
    visit?.currentStageCode ||
    visit?.stage?.code ||
    visit?.stageCode ||
    visit?.status ||
    "registered";

const getVisitTimeline = (visit) => {
    if (Array.isArray(visit?.journey_timeline)) return visit.journey_timeline;
    if (Array.isArray(visit?.journeyTimeline)) return visit.journeyTimeline;
    if (Array.isArray(visit?.timeline)) return visit.timeline;
    return [];
};

const unwrapVisit = (visit) => {
    const source = visit && typeof visit === "object" ? visit : {};
    if (source.visit && typeof source.visit === "object") return source.visit;
    if (source.data && typeof source.data === "object" && source.data.id) return source.data;
    return source;
};

const normalizeActiveVisitPayload = (response) => {
    const source = response && typeof response === "object" ? response : {};
    const patient =
        source.patient ||
        source.patient_profile ||
        source.patientProfile ||
        source.profile ||
        null;
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
        .map((rawActiveVisit) => {
            const normalizedVisit = normalizeVisit(rawActiveVisit);

            return {
                ...normalizedVisit,
                journey_timeline: getVisitTimeline(normalizedVisit),
                current_journey_stage: getVisitStageCode(normalizedVisit),
            };
        });
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
    const source = unwrapVisit(visit);
    const facilityName = pickDisplayText(
        source.facility_name,
        source.facilityName,
        source.facility?.name,
        source.facility,
        source.location,
    );
    const providerName = pickDisplayText(
        source.provider_name,
        source.providerName,
        source.provider?.full_name,
        source.provider?.name,
        source.provider,
        source.assigned_provider?.full_name,
        source.assigned_provider?.name,
        source.assigned_provider,
    );
    const chiefComplaint = pickDisplayText(
        formatComplaintValue(source.chief_complaint),
        formatComplaintValue(source.chiefComplaint),
        formatComplaintValue(source.reason),
        formatComplaintValue(source.reason_for_visit),
        formatComplaintValue(source.reasonForVisit),
    );

    return {
        ...source,
        facility_name: facilityName || "",
        facilityName: facilityName || "",
        provider: providerName || source.provider || null,
        provider_name: providerName || source.provider_name || null,
        chief_complaint: chiefComplaint || source.chief_complaint || null,
        notes: formatComplaintValue(source.notes) || source.notes || null,
        current_journey_stage: getVisitStageCode(source),
        current_stage: source.current_stage || source.currentStage || null,
        currentStage: source.currentStage || source.current_stage || null,
        journey_timeline: getVisitTimeline(source),
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

export const normalizePatientFeedItem = (item) => {
    const source = item && typeof item === "object" ? item : {};
    const facilityName = pickDisplayText(
        source.facility_name,
        source.facilityName,
        source.facility?.name,
        source.facility,
    );
    const title = pickDisplayText(source.title, source.metadata?.title) || "";
    const description = pickDisplayText(
        source.description,
        source.metadata?.description,
        source.metadata?.summary,
    ) || "";
    const resourceType = pickDisplayText(source.resource_type, source.resourceType) || "";
    const status = pickDisplayText(source.status) || "";

    return {
        ...source,
        id: source.id || null,
        patient_id: source.patient_id || source.patientId || null,
        visit_id: source.visit_id || source.visitId || null,
        facility_id: source.facility_id || source.facilityId || null,
        facility_name: facilityName,
        resource_type: resourceType,
        resource_id: source.resource_id || source.resourceId || "",
        event_type: source.event_type || source.eventType || "",
        status,
        title,
        description,
        priority: source.priority || "medium",
        occurred_at: source.occurred_at || source.occurredAt || null,
        updated_at: source.updated_at || source.updatedAt || null,
        expires_at: source.expires_at || source.expiresAt || null,
        metadata: source.metadata && typeof source.metadata === "object" ? source.metadata : {},
    };
};

export const normalizePatientFeedResponse = (response) => {
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
        if (options.page) params.push(`page=${encodeURIComponent(options.page)}`);

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

const normalizeConsentItem = (entry = {}) => {
    const metadata = entry.metadata || entry.meta || {};
    return {
        id: entry.id || entry.consent_id || entry.consentId || null,
        facility_id: entry.facility_id || entry.facilityId || null,
        facility_name: entry.facility_name || entry.facilityName || entry.provider_target_name || entry.providerTargetName || "Facility",
        scope: entry.scope || entry.consent_type || entry.consentType || null,
        status: entry.status || null,
        action: entry.action || null,
        created_at: entry.created_at || entry.createdAt || null,
        revoked_at: entry.revoked_at || entry.revokedAt || null,
        provider_target_type: entry.provider_target_type || entry.providerTargetType || null,
        provider_target_name: entry.provider_target_name || entry.providerTargetName || null,
        purpose: entry.purpose || metadata.purpose || null,
        reason: entry.reason || metadata.reason || null,
        metadata,
        raw: entry,
    };
};

const extractConsentList = (response, keys = []) => {
    if (Array.isArray(response)) return response.map(normalizeConsentItem);
    for (const key of keys) {
        if (Array.isArray(response?.[key])) {
            return response[key].map(normalizeConsentItem);
        }
    }
    if (Array.isArray(response?.items)) {
        return response.items.map(normalizeConsentItem);
    }
    return [];
};

const normalizeRecordAccessRequest = (entry = {}) => ({
    id: entry.id || entry.request_id || entry.requestId || null,
    patient_id: entry.patient_id || entry.patientId || null,
    source_facility_id: entry.source_facility_id || entry.sourceFacilityId || null,
    source_facility_name: entry.source_facility_name || entry.sourceFacilityName || null,
    requesting_facility_id:
        entry.requesting_facility_id || entry.requestingFacilityId || null,
    requesting_facility_name:
        entry.requesting_facility_name || entry.requestingFacilityName || "Facility",
    requesting_user_id: entry.requesting_user_id || entry.requestingUserId || null,
    requesting_user_name: entry.requesting_user_name || entry.requestingUserName || null,
    scope: entry.scope || null,
    purpose: entry.purpose || null,
    reason: entry.reason || null,
    status: entry.status || null,
    expires_in_days: entry.expires_in_days || entry.expiresInDays || null,
    created_at: entry.created_at || entry.createdAt || null,
    raw: entry,
});

const extractRecordAccessRequests = (response) => {
    if (Array.isArray(response)) return response.map(normalizeRecordAccessRequest);
    if (response?.request && typeof response.request === "object") {
        return [normalizeRecordAccessRequest(response.request)];
    }
    const list =
        response?.requests ||
        response?.items ||
        response?.record_access_requests ||
        response?.recordAccessRequests ||
        [];
    return Array.isArray(list) ? list.map(normalizeRecordAccessRequest) : [];
};

export const getActiveConsents = async () => {
    try {
        const response = await api.get("/patient-portal/consents/active");
        return {
            active_consents: extractConsentList(response, ["active_consents", "activeConsents", "consents"]),
            raw: response,
        };
    } catch (error) {
        console.error("Failed to fetch active consents:", error);
        throw error;
    }
};

export const getConsentHistory = async (facilityId, scope) => {
    try {
        let path = "/patient-portal/consents/history";
        const params = [];
        if (facilityId) params.push(`facility_id=${encodeURIComponent(facilityId)}`);
        if (scope) params.push(`scope=${encodeURIComponent(scope)}`);
        if (params.length) path += `?${params.join("&")}`;
        const response = await api.get(path);
        return {
            history: extractConsentList(response, ["history", "consent_history", "consentHistory"]),
            raw: response,
        };
    } catch (error) {
        console.error("Failed to fetch consent history:", error);
        throw error;
    }
};

export const getRecordAccessRequests = async ({
    patientId,
    sourceFacilityId,
    requestingFacilityId,
    status,
    page = 1,
    limit = 20,
} = {}) => {
    try {
        const params = [];
        if (patientId) params.push(`patient_id=${encodeURIComponent(patientId)}`);
        if (sourceFacilityId) {
            params.push(`source_facility_id=${encodeURIComponent(sourceFacilityId)}`);
        }
        if (requestingFacilityId) {
            params.push(
                `requesting_facility_id=${encodeURIComponent(requestingFacilityId)}`,
            );
        }
        if (status) params.push(`status=${encodeURIComponent(status)}`);
        params.push(`page=${page}`);
        params.push(`limit=${limit}`);
        const response = await api.get(`/record-access/requests?${params.join("&")}`);
        const requests = extractRecordAccessRequests(response);
        if (requests.length === 0 && patientId) {
            const fallbackParams = params.filter(
                (param) => !param.startsWith("patient_id="),
            );
            const fallbackResponse = await api.get(
                `/record-access/requests?${fallbackParams.join("&")}`,
            );
            return {
                requests: extractRecordAccessRequests(fallbackResponse),
                raw: fallbackResponse,
            };
        }
        return {
            requests,
            raw: response,
        };
    } catch (error) {
        console.error("Failed to fetch record access requests:", error);
        throw error;
    }
};

export const approveRecordAccessRequest = async (requestId, data = {}) => {
    try {
        return await api.post(`/record-access/requests/${requestId}/approve`, data);
    } catch (error) {
        console.error("Failed to approve record access request:", error);
        throw error;
    }
};

export const declineRecordAccessRequest = async (requestId, data = {}) => {
    try {
        return await api.post(`/record-access/requests/${requestId}/decline`, data);
    } catch (error) {
        console.error("Failed to decline record access request:", error);
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

export const updatePatientProfile = async (accountId, data) => {
    try {
        if (!accountId) {
            throw new Error("Patient account ID is required.");
        }

        const payload = {
            name: data?.name || undefined,
            date_of_birth: data?.date_of_birth || data?.dateOfBirth || undefined,
            gender: data?.gender || undefined,
            emergency_contact_name:
                data?.emergency_contact_name || data?.emergencyContactName || undefined,
            emergency_contact_phone:
                data?.emergency_contact_phone || data?.emergencyContactPhone || undefined,
        };

        const response = await api.patch(`/patient-portal/accounts/${accountId}`, payload);
        return response;
    } catch (error) {
        console.error("Failed to update patient profile:", error);
        throw error;
    }
};
