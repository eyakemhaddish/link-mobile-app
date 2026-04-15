import React from "react";

import { api, onUnauthorized } from "../lib/api";
import {
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  getAuthProfile,
  setAuthProfile,
  clearAuthProfile,
  clearStoredPatientPhone,
} from "../lib/auth";
import { unregisterStoredPatientPushDevice } from "../services/notificationService";

const AuthContext = React.createContext(null);

const pickFirstTruthy = (...values) => {
  for (const value of values) {
    if (value) return value;
  }
  return null;
};

const normalizeWorkspace = (workspace) => {
  if (!workspace || typeof workspace !== "object") return null;
  return {
    workspaceType:
      workspace.workspaceType || workspace.workspace_type || "clinic",
    setupMode: workspace.setupMode || workspace.setup_mode || "legacy",
    teamMode: workspace.teamMode || workspace.team_mode || "legacy",
    enabledModules: Array.isArray(
      workspace.enabledModules || workspace.enabled_modules,
    )
      ? (workspace.enabledModules || workspace.enabled_modules).filter(
          (entry) => typeof entry === "string",
        )
      : [],
  };
};

const normalizeProfilePayload = (payload) => {
  if (!payload || typeof payload !== "object") return null;

  const source =
    payload.user && typeof payload.user === "object" ? payload.user : payload;
  const role =
    source.role ||
    source.user_role ||
    payload.role ||
    payload.user_role ||
    null;
  const workspace = normalizeWorkspace(source.workspace || payload.workspace);
  const normalizedRole = role || null;

  if (normalizedRole === "patient") {
    const patientId = pickFirstTruthy(
      source.patient_id,
      source.patient_account_id,
      source.id,
    );
    const userId = pickFirstTruthy(
      source.user_id,
      source.auth_user_id,
      source.id,
    );
    const fullName = pickFirstTruthy(
      source.full_name,
      source.fullName,
      source.name,
    );
    const fallbackName = [source.first_name, source.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();
    const resolvedFullName = fullName || fallbackName || "Patient";
    const nameParts = String(resolvedFullName).split(/\s+/).filter(Boolean);

    return {
      ...source,
      role: "patient",
      workspace,
      id: patientId || userId || source.id || null,
      patient_id: patientId || null,
      user_id: userId || null,
      full_name: resolvedFullName,
      first_name: source.first_name || nameParts[0] || "Patient",
      last_name: source.last_name || nameParts.slice(1).join(" "),
      phone: source.phone || source.phone_number || null,
      phone_number: source.phone_number || source.phone || null,
    };
  }

  return {
    ...source,
    role: normalizedRole,
    workspace,
  };
};

const normalizePatientPayload = (payload) => {
  if (!payload || typeof payload !== "object") return null;

  const userPart =
    payload.user && typeof payload.user === "object" ? payload.user : null;
  const patientPart =
    payload.patient && typeof payload.patient === "object"
      ? payload.patient
      : null;
  const flatPatientPart = !userPart && !patientPart ? payload : null;

  const patientId = pickFirstTruthy(
    patientPart?.id,
    patientPart?.patient_id,
    patientPart?.patient_account_id,
    userPart?.patient_id,
    userPart?.patient_account_id,
    flatPatientPart?.patient_id,
    flatPatientPart?.id,
  );
  const userId = pickFirstTruthy(
    userPart?.id,
    userPart?.user_id,
    patientPart?.user_id,
    flatPatientPart?.user_id,
    flatPatientPart?.id,
  );

  const patient = {
    ...(userPart || {}),
    ...(patientPart || {}),
    ...(flatPatientPart || {}),
    ...(userPart?.id && !patientPart?.id ? { id: userPart.id } : {}),
  };

  if (
    !patient ||
    typeof patient !== "object" ||
    !(patientId || userId || patient.id)
  )
    return null;

  const fallbackName = [patient.first_name, patient.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const fullName =
    patient.full_name || patient.name || fallbackName || "Patient";
  const nameParts = fullName.split(/\s+/).filter(Boolean);
  const firstName = patient.first_name || nameParts[0] || "Patient";
  const lastName = patient.last_name || nameParts.slice(1).join(" ");

  return {
    ...patient,
    id: patientId || userId || patient.id,
    patient_id: patientId || null,
    user_id: userId || null,
    role: "patient",
    full_name: fullName,
    first_name: firstName,
    last_name: lastName,
    phone: patient.phone || patient.phone_number || null,
    phone_number: patient.phone_number || patient.phone || null,
  };
};

const mergePatientProfile = (serverProfile, cachedProfile) => {
  if (!serverProfile || !cachedProfile) return serverProfile || cachedProfile || null;
  if (serverProfile?.role !== "patient" || cachedProfile?.role !== "patient") {
    return serverProfile;
  }

  const samePatient =
    (serverProfile?.patient_id && cachedProfile?.patient_id && serverProfile.patient_id === cachedProfile.patient_id) ||
    (serverProfile?.user_id && cachedProfile?.user_id && serverProfile.user_id === cachedProfile.user_id) ||
    (serverProfile?.id && cachedProfile?.id && serverProfile.id === cachedProfile.id);

  if (!samePatient) return serverProfile;

  const preferredFullName = pickFirstTruthy(
    cachedProfile?.full_name,
    cachedProfile?.fullName,
    cachedProfile?.name,
  );
  const [firstName, ...lastNameParts] = String(preferredFullName || "").trim().split(/\s+/).filter(Boolean);

  return {
    ...serverProfile,
    full_name: preferredFullName || serverProfile.full_name,
    name: preferredFullName || serverProfile.name,
    first_name: cachedProfile?.first_name || firstName || serverProfile.first_name,
    last_name:
      cachedProfile?.last_name ||
      (lastNameParts.length ? lastNameParts.join(" ") : serverProfile.last_name),
    date_of_birth: cachedProfile?.date_of_birth || serverProfile.date_of_birth,
    gender: cachedProfile?.gender || serverProfile.gender,
    sex: cachedProfile?.sex || cachedProfile?.gender || serverProfile.sex,
    emergency_contact_name:
      cachedProfile?.emergency_contact_name || serverProfile.emergency_contact_name,
    emergency_contact_phone:
      cachedProfile?.emergency_contact_phone || serverProfile.emergency_contact_phone,
  };
};

const resolveRole = (profile) => profile?.role || profile?.user_role || null;

export const AuthProvider = ({ children }) => {
  const [token, setToken] = React.useState(null);
  const [user, setUser] = React.useState(null); // { id, role, full_name, … }
  const [loading, setLoading] = React.useState(true);

  const normalizeAnyProfile = React.useCallback(
    (profile) =>
      normalizeProfilePayload(profile) ||
      normalizePatientPayload(profile) ||
      profile ||
      null,
    [],
  );

  const fetchProfile = React.useCallback(async (cachedProfile = null) => {
    try {
      const patientResponse = await api.get("/patient-auth/me");
      const normalizedPatient = normalizePatientPayload(patientResponse);
      if (normalizedPatient) return mergePatientProfile(normalizedPatient, cachedProfile);
    } catch {
      // Fall through to user profile lookup.
    }

    try {
      const userResponse = await api.get("/users/me");
      const normalizedUser = normalizeProfilePayload(userResponse);
      if (normalizedUser) return normalizedUser;
    } catch {
      // Keep existing behavior: token can still be retained without profile payload.
    }

    return null;
  }, []);

  // ── Bootstrap: restore token then fetch profile ──────────────────────
  React.useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        const stored = await getAuthToken();
        if (!stored || !active) return;

        setToken(stored);

        const cachedProfile = await getAuthProfile();
        if (active && cachedProfile) {
          setUser(normalizeAnyProfile(cachedProfile));
        }

        const profile = await fetchProfile(cachedProfile);
        if (active && profile) {
          setUser(profile);
          await setAuthProfile(profile);
        }
      } catch {
        // no stored token
      } finally {
        if (active) setLoading(false);
      }
    };

    bootstrap();
    return () => {
      active = false;
    };
  }, [fetchProfile, normalizeAnyProfile]);

  // ── Sign in ───────────────────────────────────────────────────────────
  const signInWithToken = async (nextToken, profile = null) => {
    try {
      await setAuthToken(nextToken);
    } catch (err) {
      console.warn("Persistent auth storage failed:", err);
    }
    setToken(nextToken);

    const cachedProfile = await getAuthProfile();

    // Accept profile passed in (from LoginScreen) or fetch fresh
    const resolvedProfile = profile
      ? normalizeAnyProfile(profile)
      : await fetchProfile(cachedProfile);

    if (resolvedProfile) {
      setUser(resolvedProfile);
      try {
        await setAuthProfile(resolvedProfile);
      } catch (err) {
        console.warn("Persistent profile storage failed:", err);
      }
    } else {
      setUser(null);
    }
  };

  // ── Sign out ──────────────────────────────────────────────────────────
  const signOut = async () => {
    try {
      await unregisterStoredPatientPushDevice();
    } catch {
      // Non-fatal: clear local auth state regardless.
    }
    try {
      await api.post("/patient-auth/logout");
    } catch {
      // Non-fatal: clear local auth state regardless.
    }
    await clearAuthToken();
    await clearAuthProfile();
    await clearStoredPatientPhone();
    setToken(null);
    setUser(null);
  };

  React.useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      setToken(null);
      setUser(null);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const role = resolveRole(user);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role,
        loading,
        isAuthenticated: Boolean(token),
        signInWithToken,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default AuthContext;
