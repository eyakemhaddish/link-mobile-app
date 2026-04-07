import { Linking } from "react-native";

const normalize = (value) => String(value || "").trim().toLowerCase();

export const inferPatientFeedAction = (item) => {
  const resourceType = normalize(item?.resource_type || item?.resourceType);
  const status = normalize(item?.status);
  const visitId = item?.visit_id || item?.visitId || null;
  const facilityName = item?.facility_name || item?.facilityName || "Facility";

  switch (resourceType) {
    case "visit":
      return {
        label: status === "completed" ? "View summary" : "View visit",
        icon: "activity",
        target: visitId
          ? {
              screen: "PatientVisitDetails",
              params: { visitId, isActiveVisit: status !== "completed" },
            }
          : null,
      };
    case "medication_order":
      return {
        label: status === "ready" ? "Review medication" : "View order",
        icon: "package",
        secondaryLabel: status === "ready" ? "Set reminder" : null,
        target: visitId
          ? {
              screen: "PatientVisitDetails",
              params: { visitId },
            }
          : {
              screen: "PatientHealthRecords",
            },
      };
    case "lab_result":
    case "imaging_result":
      return {
        label: "View results",
        icon: "clipboard",
        target: visitId
          ? {
              screen: "PatientVisitDetails",
              params: { visitId },
            }
          : {
              screen: "PatientHealthRecords",
            },
      };
    case "lab_order":
    case "imaging_order":
      return {
        label: "Review order",
        icon: "file-text",
        target: visitId
          ? {
              screen: "PatientVisitDetails",
              params: { visitId },
            }
          : null,
      };
    case "payment":
      return {
        label: "Review payment",
        icon: "credit-card",
        target: visitId
          ? {
              screen: "PatientVisitDetails",
              params: { visitId },
            }
          : null,
      };
    case "appointment":
      return {
        label: status === "pending" ? "Check appointment" : "Open appointment",
        icon: "calendar",
        target: { screen: "PatientAppointments" },
      };
    case "document":
      return {
        label: "Open records",
        icon: "folder",
        target: { screen: "PatientHealthRecords" },
      };
    case "consent":
      return {
        label: "Manage access",
        icon: "shield",
        target: { screen: "PatientConsent" },
      };
    case "reminder":
      return {
        label: "Open appointments",
        icon: "bell",
        target: { screen: "PatientAppointments" },
      };
    default:
      return {
        label: visitId ? "Open visit" : "Open details",
        icon: "chevron-right",
        target: visitId
          ? {
              screen: "PatientVisitDetails",
              params: { visitId },
            }
          : null,
      };
  }
};

export const performPatientFeedAction = async (navigation, item) => {
  const inferred = inferPatientFeedAction(item);

  if (!inferred?.target) return false;

  if (inferred.target.externalUrl) {
    await Linking.openURL(inferred.target.externalUrl);
    return true;
  }

  if (inferred.target.screen) {
    navigation.navigate(inferred.target.screen, inferred.target.params || {});
    return true;
  }

  return false;
};
