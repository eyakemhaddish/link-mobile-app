import React from "react";
import { View, Text, StyleSheet, ActivityIndicator, Platform, Pressable } from "react-native";
import Screen from "../components/ui/Screen";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import HeroHeader from "../components/ui/HeroHeader";
import Input from "../components/ui/Input";
import { colors, spacing, typography } from "../theme/tokens";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../lib/api";
import { PATIENT_TENANT_ID } from "../lib/env";
import {
  getStoredPatientPhone,
  setStoredPatientPhone,
  clearStoredPatientPhone,
} from "../lib/auth";

const isWeb = Platform.OS === "web";

const DEMO_USERS = {
  "1234": {
    token: "demo-token-abebe",
    label: "Patient",
    profile: {
      id: "demo-patient-abebe-001",
      role: "patient",
      full_name: "Abebe Metaferia Alemey",
      first_name: "Abebe",
      last_name: "Alemey",
      email: "abebe.metaferia@linkhc.org",
      phone: "+251911000001",
      facility_id: "demo-facility-zelalem-001",
      facility_name: "Zelalem Hospital",
    },
  },
  "5678": {
    token: "demo-token-birtukan-hew",
    label: "Health Extension Worker",
    profile: {
      id: "demo-hew-birtukan-001",
      role: "hew",
      full_name: "Birtukan Tadesse",
      first_name: "Birtukan",
      last_name: "Tadesse",
      email: "birtukan.tadesse@linkhc.org",
      phone: "+251911000099",
      facility_id: "demo-facility-zelalem-001",
      facility_name: "Zelalem Hospital",
    },
  },
};

const normalizePhoneNumber = (value) => (value || "").replace(/\s+/g, "").trim();

const pickFirstTruthy = (...values) => {
  for (const value of values) {
    if (value) return value;
  }
  return null;
};

const buildPatientProfile = (authResponse, fallbackPhone) => {
  const userSource =
    authResponse?.user && typeof authResponse.user === "object" ? authResponse.user : {};
  const patientSource =
    authResponse?.patient && typeof authResponse.patient === "object" ? authResponse.patient : {};
  const source = { ...userSource, ...patientSource };

  const patientId = pickFirstTruthy(
    patientSource.id,
    patientSource.patient_id,
    patientSource.patient_account_id,
    userSource.patient_id,
    userSource.patient_account_id,
    source.id
  );
  const userId = pickFirstTruthy(
    userSource.id,
    patientSource.user_id,
    source.user_id,
    source.id
  );
  const fullName = pickFirstTruthy(
    userSource.name,
    userSource.full_name,
    userSource.fullName,
    patientSource.name,
    patientSource.full_name,
    patientSource.fullName
  ) || "Patient";
  const [firstName, ...lastNameParts] = String(fullName).trim().split(/\s+/);

  return {
    ...source,
    id: patientId || userId || "patient",
    patient_id: patientId || null,
    user_id: userId || null,
    role: "patient",
    full_name: fullName,
    first_name: pickFirstTruthy(userSource.first_name, patientSource.first_name, firstName) || "Patient",
    last_name: pickFirstTruthy(userSource.last_name, patientSource.last_name, lastNameParts.join(" ")),
    phone: pickFirstTruthy(userSource.phone, userSource.phone_number, patientSource.phone, patientSource.phone_number, fallbackPhone) || "",
    phone_number: pickFirstTruthy(userSource.phone_number, patientSource.phone_number, userSource.phone, patientSource.phone, fallbackPhone) || "",
    facility_id: pickFirstTruthy(patientSource.facility_id, userSource.facility_id, source.facility_id),
    facility_name: pickFirstTruthy(patientSource.facility_name, userSource.facility_name, source.facility_name),
    tenant_id: pickFirstTruthy(patientSource.tenant_id, userSource.tenant_id, source.tenant_id),
  };
};

const getAuthTokenFromResponse = (response) =>
  response?.sessionToken ||
  response?.session_token ||
  response?.access_token ||
  response?.token ||
  response?.accessToken ||
  null;

const LoginScreen = () => {
  const { signInWithToken } = useAuth();
  const { showToast } = useToast();
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [storedPatientPhone, setStoredPatientPhoneState] = React.useState("");
  const [phoneLoaded, setPhoneLoaded] = React.useState(false);
  const [otp, setOtp] = React.useState("");
  const [otpRequested, setOtpRequested] = React.useState(false);
  const [requiresRegistration, setRequiresRegistration] = React.useState(false);
  const [name, setName] = React.useState("");
  const [dateOfBirth, setDateOfBirth] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [emergencyContactName, setEmergencyContactName] = React.useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = React.useState("");
  const [patientPassword, setPatientPassword] = React.useState("");
  const [patientPasswordConfirm, setPatientPasswordConfirm] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pin, setPin] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [mode, setMode] = React.useState("patient");

  React.useEffect(() => {
    let active = true;

    const loadStoredPhone = async () => {
      try {
        const storedPhone = normalizePhoneNumber(await getStoredPatientPhone());
        if (!active) return;

        if (storedPhone) {
          setStoredPatientPhoneState(storedPhone);
          setPhoneNumber(storedPhone);
          setMode("patient");
        } else {
          setMode("patient_onboarding");
        }
      } catch {
        if (active) setMode("patient_onboarding");
      } finally {
        if (active) setPhoneLoaded(true);
      }
    };

    loadStoredPhone();
    return () => {
      active = false;
    };
  }, []);

  const resetRegistrationFields = React.useCallback(() => {
    setName("");
    setDateOfBirth("");
    setGender("");
    setEmergencyContactName("");
    setEmergencyContactPhone("");
    setPatientPassword("");
    setPatientPasswordConfirm("");
  }, []);

  const resetOtpFlow = React.useCallback(() => {
    setOtp("");
    setOtpRequested(false);
    setRequiresRegistration(false);
    resetRegistrationFields();
  }, [resetRegistrationFields]);

  const switchMode = React.useCallback((nextMode) => {
    setMode(nextMode);
    setError("");
  }, []);

  const completePatientSignIn = React.useCallback(async ({ authResponse, fallbackPhone }) => {
    const sessionToken = getAuthTokenFromResponse(authResponse);
    if (!sessionToken) {
      setError("Unable to start patient session. Please try again.");
      return false;
    }

    const profile = buildPatientProfile(authResponse, fallbackPhone);
    const resolvedPhone = normalizePhoneNumber(profile.phone_number || profile.phone || fallbackPhone);

    await signInWithToken(sessionToken, profile);
    if (resolvedPhone) {
      await setStoredPatientPhone(resolvedPhone);
      setStoredPatientPhoneState(resolvedPhone);
      setPhoneNumber(resolvedPhone);
    }
    showToast(`Welcome, ${profile.first_name}!`, "success");
    return true;
  }, [showToast, signInWithToken]);

  const handleRequestOtp = async () => {
    if (loading) return;

    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!normalizedPhone || normalizedPhone.length < 8) {
      setError("Please enter a valid phone number.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await api.post(
        "/patient-auth/request-otp",
        { phone_number: normalizedPhone },
        { auth: false }
      );
      setOtpRequested(true);
      setRequiresRegistration(false);
      showToast("Verification code sent.", "success");
    } catch (err) {
      setError(err?.message || "Unable to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (loading) return;

    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!normalizedPhone || normalizedPhone.length < 8) {
      setError("Please enter a valid phone number.");
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await api.post(
        "/patient-auth/verify-otp",
        { phone_number: normalizedPhone, otp },
        { auth: false }
      );

      const signedIn = await completePatientSignIn({
        authResponse: response,
        fallbackPhone: normalizedPhone,
      });

      if (!signedIn) {
        setRequiresRegistration(true);
        showToast("Phone verified. Create a password to finish your account.", "success");
      }
    } catch (err) {
      if (err?.status === 404 && err?.payload?.error === "patient_not_found") {
        setRequiresRegistration(true);
        showToast("Phone verified. Complete registration to continue.", "success");
      } else {
        setError(err?.message || "Unable to verify code.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPatient = async () => {
    if (loading) return;

    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    const normalizedEmergencyPhone = normalizePhoneNumber(emergencyContactPhone);

    if (!normalizedPhone || normalizedPhone.length < 8) {
      setError("Please enter a valid phone number.");
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter the 6-digit verification code.");
      return;
    }
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!patientPassword || patientPassword.length < 6) {
      setError("Please create a password with at least 6 characters.");
      return;
    }
    if (patientPassword !== patientPasswordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await api.post(
        "/patient-auth/register",
        {
          phone_number: normalizedPhone,
          otp,
          name: name.trim(),
          date_of_birth: dateOfBirth.trim() || undefined,
          gender: gender.trim() || undefined,
          emergency_contact_name: emergencyContactName.trim() || undefined,
          emergency_contact_phone: normalizedEmergencyPhone || undefined,
          tenant_id: PATIENT_TENANT_ID || undefined,
          password: patientPassword,
        },
        { auth: false }
      );
      await completePatientSignIn({
        authResponse: response,
        fallbackPhone: normalizedPhone,
      });
    } catch (err) {
      if (err?.status === 409 && err?.payload?.error === "phone_number_in_use_by_non_patient_user") {
        setError("This phone number is already used by a non-patient account. Contact support.");
      } else if (err?.status === 409 && err?.payload?.error === "patient_exists") {
        setRequiresRegistration(false);
        setMode("patient");
        setStoredPatientPhoneState(normalizedPhone);
        setPhoneNumber(normalizedPhone);
        await setStoredPatientPhone(normalizedPhone);
        setError("An account already exists for this number. Enter your password to sign in.");
      } else {
        setError(err?.message || "Unable to complete registration.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePatientPasswordSignIn = async () => {
    if (loading) return;

    const normalizedPhone = normalizePhoneNumber(storedPatientPhone || phoneNumber);
    if (!normalizedPhone) {
      setError("No phone number is stored on this device. Use another phone number.");
      return;
    }
    if (!patientPassword) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await api.post(
        "/patient-auth/sign-in",
        {
          phone_number: normalizedPhone,
          password: patientPassword,
        },
        { auth: false }
      );
      await completePatientSignIn({
        authResponse: response,
        fallbackPhone: normalizedPhone,
      });
    } catch (err) {
      setError(err?.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleUseAnotherPhoneNumber = async () => {
    if (loading) return;
    await clearStoredPatientPhone();
    setStoredPatientPhoneState("");
    setPhoneNumber("");
    setPatientPassword("");
    resetOtpFlow();
    switchMode("patient_onboarding");
  };

  const handlePinLogin = async () => {
    if (loading) return;

    if (pin.length !== 4) {
      setError("Please enter a 4-digit PIN");
      return;
    }

    const match = DEMO_USERS[pin];
    if (!match) {
      setError("Invalid PIN. Try 1234 (Patient) or 5678 (HEW).");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await api.post(
        "/patient-auth/dev-login",
        { phone_number: match.profile.phone, pin },
        { auth: false }
      );

      const token = getAuthTokenFromResponse(response) || match.token;
      const profile = buildPatientProfile(
        {
          user: response?.user || match.profile,
          patient: response?.patient || match.profile,
        },
        match.profile.phone
      );

      showToast(`Welcome, ${profile.first_name}! (${match.label})`, "success");
      await signInWithToken(token, profile);
      await setStoredPatientPhone(normalizePhoneNumber(match.profile.phone));
    } catch (err) {
      setError(err?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClinicianLogin = async () => {
    if (loading) return;

    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await api.post(
        "/auth/login",
        {
          username: email.trim(),
          password,
        },
        { auth: false }
      );

      const token = getAuthTokenFromResponse(response);
      if (!token) {
        setError("Unable to start session. Please try again.");
        return;
      }

      await signInWithToken(token);
      await api.get("/users/me").catch(() => null);
    } catch (err) {
      const payloadMessage =
        err?.payload?.message ||
        err?.payload?.error ||
        err?.message ||
        "Sign in failed.";
      setError(payloadMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!phoneLoaded) {
    return (
      <Screen variant="hero">
        <View style={styles.loadingShell}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingShellText}>Preparing sign in...</Text>
        </View>
      </Screen>
    );
  }

  if (mode === "patient") {
    return (
      <Screen variant="hero">
        <HeroHeader
          badge="Patient Portal"
          eyebrow="Link Health"
          title="Patient Portal"
          subtitle="Sign in to your patient account with the phone number stored on this device."
          style={styles.header}
        />

        <Card style={styles.card}>
          <Text style={styles.label}>Phone number on this device</Text>
          <View style={styles.readonlyField}>
            <Text style={styles.readonlyValue}>{storedPatientPhone || "No stored phone number"}</Text>
          </View>

          <Text style={styles.label}>Password</Text>
          <Input
            value={patientPassword}
            onChangeText={(text) => {
              setPatientPassword(text);
              setError("");
            }}
            secureTextEntry
            placeholder="Enter your password"
            testID="patient-password"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Button title="Sign in" onPress={handlePatientPasswordSignIn} />
            <Button
              title="Use another phone number"
              variant="secondary"
              onPress={handleUseAnotherPhoneNumber}
            />
            {loading ? <ActivityIndicator color={colors.primary} /> : null}
          </View>
        </Card>

        <View style={styles.testActions}>
          <Pressable onPress={() => switchMode("email")} style={styles.switchMode}>
            <Text style={styles.switchModeText}>Clinician or HEW sign in</Text>
          </Pressable>
          <Pressable onPress={() => switchMode("pin")} style={styles.switchMode}>
            <Text style={styles.switchModeText}>Use demo PIN instead</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  if (mode === "patient_onboarding") {
    return (
      <Screen variant="hero">
        <HeroHeader
          badge="Create Account"
          eyebrow="Link Health"
          title="Create Patient Account"
          subtitle="Verify your phone number first, then finish setting up your account."
          style={styles.header}
        />

        <Card style={styles.card}>
          <Text style={styles.label}>Phone number</Text>
          <Input
            value={phoneNumber}
            onChangeText={(text) => {
              setPhoneNumber(text);
              setError("");
            }}
            keyboardType="phone-pad"
            autoCapitalize="none"
            placeholder="+251 911 000 001"
            testID="login-phone"
          />

          {otpRequested ? (
            <>
              <Text style={styles.label}>Verification code</Text>
              <Input
                value={otp}
                onChangeText={(text) => {
                  setOtp(text.replace(/\D/g, "").slice(0, 6));
                  setError("");
                }}
                keyboardType="numeric"
                placeholder="123456"
                maxLength={6}
                testID="login-otp"
              />
            </>
          ) : null}

          {requiresRegistration ? (
            <>
              <Text style={styles.registrationHint}>
                Complete your account details and create a password for future sign-ins.
              </Text>

              <Text style={styles.label}>Full name</Text>
              <Input
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setError("");
                }}
                placeholder="Abebe Metaferia Alemey"
                testID="register-name"
              />

              <Text style={styles.label}>Create password</Text>
              <Input
                value={patientPassword}
                onChangeText={(text) => {
                  setPatientPassword(text);
                  setError("");
                }}
                secureTextEntry
                placeholder="At least 6 characters"
              />

              <Text style={styles.label}>Confirm password</Text>
              <Input
                value={patientPasswordConfirm}
                onChangeText={(text) => {
                  setPatientPasswordConfirm(text);
                  setError("");
                }}
                secureTextEntry
                placeholder="Re-enter password"
              />

              <Text style={styles.label}>Date of birth (optional)</Text>
              <Input
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                placeholder="1990-01-31"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Gender (optional)</Text>
              <Input
                value={gender}
                onChangeText={setGender}
                placeholder="female / male / other"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Emergency contact name (optional)</Text>
              <Input
                value={emergencyContactName}
                onChangeText={setEmergencyContactName}
                placeholder="Relative or caregiver"
              />

              <Text style={styles.label}>Emergency contact phone (optional)</Text>
              <Input
                value={emergencyContactPhone}
                onChangeText={setEmergencyContactPhone}
                keyboardType="phone-pad"
                placeholder="+251 9..."
              />
            </>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            {!otpRequested ? <Button title="Send code" onPress={handleRequestOtp} /> : null}
            {otpRequested && !requiresRegistration ? (
              <Button title="Verify phone" onPress={handleVerifyOtp} />
            ) : null}
            {otpRequested && requiresRegistration ? (
              <Button title="Create account" onPress={handleRegisterPatient} />
            ) : null}
            {otpRequested ? (
              <Button
                title="Use another phone number"
                variant="secondary"
                onPress={resetOtpFlow}
              />
            ) : null}
            {loading ? <ActivityIndicator color={colors.primary} /> : null}
          </View>
        </Card>

        <View style={styles.testActions}>
          <Pressable
            onPress={() => {
              if (storedPatientPhone) {
                setPatientPassword("");
                switchMode("patient");
              }
            }}
            style={styles.switchMode}
          >
            <Text style={styles.switchModeText}>
              {storedPatientPhone ? "Back to password sign in" : "Password sign in available after account setup"}
            </Text>
          </Pressable>
          <Pressable onPress={() => switchMode("email")} style={styles.switchMode}>
            <Text style={styles.switchModeText}>Clinician or HEW sign in</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  if (mode === "pin") {
    return (
      <Screen variant="hero">
        <HeroHeader
          badge="Demo Access"
          eyebrow="Link Health"
          title="Demo Mode"
          subtitle="Use demo PINs only for sandbox testing."
          style={styles.header}
        />

        <Card style={styles.card}>
          <Text style={styles.label}>PIN</Text>
          <Input
            value={pin}
            onChangeText={(text) => {
              const digits = text.replace(/\D/g, "").slice(0, 4);
              setPin(digits);
              setError("");
            }}
            keyboardType="numeric"
            secureTextEntry
            placeholder="••••"
            maxLength={4}
            testID="login-pin"
          />

          <View style={styles.pinDots}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i < pin.length && styles.dotFilled,
                ]}
              />
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Button title="Sign in with demo PIN" onPress={handlePinLogin} />
            {loading ? <ActivityIndicator color={colors.primary} /> : null}
          </View>
        </Card>

        <View style={styles.testActions}>
          <Text style={styles.hintText}>1234 = Patient (Abebe) · 5678 = HEW (Birtukan)</Text>
          <Pressable
            onPress={() => switchMode(storedPatientPhone ? "patient" : "patient_onboarding")}
            style={styles.switchMode}
          >
            <Text style={styles.switchModeText}>Back to patient sign in</Text>
          </Pressable>
          {!isWeb ? (
            <Pressable onPress={() => switchMode("email")} style={styles.switchMode}>
              <Text style={styles.switchModeText}>Use clinician email sign in</Text>
            </Pressable>
          ) : null}
        </View>
      </Screen>
    );
  }

  return (
    <Screen variant="hero">
      <HeroHeader
        badge="Staff Access"
        eyebrow="Link Health"
        title="Clinician Sign In"
        subtitle="Sign in with your clinic credentials."
        style={styles.header}
      />

      <Card style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Input
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="name@clinic.com"
          testID="login-email"
        />

        <Text style={styles.label}>Password</Text>
        <Input
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          testID="login-password"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actions}>
          <Button title="Sign in" onPress={handleClinicianLogin} />
          {loading ? <ActivityIndicator color={colors.primary} /> : null}
        </View>
      </Card>

      <View style={styles.testActions}>
        <Pressable
          onPress={() => switchMode(storedPatientPhone ? "patient" : "patient_onboarding")}
          style={styles.switchMode}
        >
          <Text style={styles.switchModeText}>Back to patient sign in</Text>
        </Pressable>
        <Pressable onPress={() => switchMode("pin")} style={styles.switchMode}>
          <Text style={styles.switchModeText}>Use demo PIN instead</Text>
        </Pressable>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.xl,
  },
  card: {
    gap: spacing.sm,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#E0E6EA",
    shadowColor: "#004277",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  label: {
    ...typography.caption,
    color: "#52616B",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  registrationHint: {
    ...typography.caption,
    color: "#3B5E74",
    marginBottom: spacing.xs,
    backgroundColor: "#EFF6FB",
    borderRadius: 16,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  readonlyField: {
    borderWidth: 1,
    borderColor: "#D8E1E7",
    borderRadius: 18,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: "#F4F7F8",
  },
  readonlyValue: {
    ...typography.body,
    color: "#18384C",
    fontWeight: "600",
  },
  actions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  testActions: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "#DCE5E8",
    alignItems: "center",
  },
  error: {
    color: "#B42318",
    ...typography.caption,
    backgroundColor: "#FFF1F1",
    borderRadius: 14,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  pinDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginVertical: spacing.sm,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#D2DDE4",
    backgroundColor: "transparent",
  },
  dotFilled: {
    backgroundColor: "#005A9E",
    borderColor: "#005A9E",
  },
  hintText: {
    fontSize: 12,
    color: "#61717C",
    textAlign: "center",
    lineHeight: 18,
  },
  switchMode: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    backgroundColor: "#F4F7F8",
  },
  switchModeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#005A9E",
    textAlign: "center",
  },
  loadingShell: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
  },
  loadingShellText: {
    ...typography.body,
    color: "#53626E",
  },
});

export default LoginScreen;
