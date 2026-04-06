import { Platform } from "react-native";

// expo-secure-store uses a native module that crashes on web at import time.
let SecureStore = null;
if (Platform.OS !== "web") {
  SecureStore = require("expo-secure-store");
}

const TOKEN_KEY = "linkhc_auth_token";
const PROFILE_KEY = "linkhc_auth_profile_v1";
const PATIENT_PHONE_KEY = "linkhc_patient_phone_v1";

// Platform-specific storage: SecureStore for native, localStorage for web
const isWeb = Platform.OS === "web";

export const getAuthToken = async () => {
  if (isWeb) {
    return localStorage.getItem(TOKEN_KEY);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
};

export const setAuthToken = async (token) => {
  if (!token) {
    if (isWeb) {
      localStorage.removeItem(TOKEN_KEY);
      return;
    }
    return SecureStore.deleteItemAsync(TOKEN_KEY);
  }

  if (isWeb) {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  return SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const clearAuthToken = async () => {
  if (isWeb) {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  return SecureStore.deleteItemAsync(TOKEN_KEY);
};

export const getAuthProfile = async () => {
  try {
    const raw = isWeb
      ? localStorage.getItem(PROFILE_KEY)
      : await SecureStore.getItemAsync(PROFILE_KEY);

    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setAuthProfile = async (profile) => {
  if (!profile) {
    if (isWeb) {
      localStorage.removeItem(PROFILE_KEY);
      return;
    }
    return SecureStore.deleteItemAsync(PROFILE_KEY);
  }

  const serialized = JSON.stringify(profile);
  if (isWeb) {
    localStorage.setItem(PROFILE_KEY, serialized);
    return;
  }
  return SecureStore.setItemAsync(PROFILE_KEY, serialized);
};

export const clearAuthProfile = async () => {
  if (isWeb) {
    localStorage.removeItem(PROFILE_KEY);
    return;
  }
  return SecureStore.deleteItemAsync(PROFILE_KEY);
};

export const getStoredPatientPhone = async () => {
  if (isWeb) {
    return localStorage.getItem(PATIENT_PHONE_KEY);
  }
  return SecureStore.getItemAsync(PATIENT_PHONE_KEY);
};

export const setStoredPatientPhone = async (phoneNumber) => {
  if (!phoneNumber) {
    if (isWeb) {
      localStorage.removeItem(PATIENT_PHONE_KEY);
      return;
    }
    return SecureStore.deleteItemAsync(PATIENT_PHONE_KEY);
  }

  if (isWeb) {
    localStorage.setItem(PATIENT_PHONE_KEY, phoneNumber);
    return;
  }
  return SecureStore.setItemAsync(PATIENT_PHONE_KEY, phoneNumber);
};

export const clearStoredPatientPhone = async () => {
  if (isWeb) {
    localStorage.removeItem(PATIENT_PHONE_KEY);
    return;
  }
  return SecureStore.deleteItemAsync(PATIENT_PHONE_KEY);
};
