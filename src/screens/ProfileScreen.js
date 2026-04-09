import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import HeroHeader from "../components/ui/HeroHeader";
import Input from "../components/ui/Input";
import Screen from "../components/ui/Screen";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { updatePatientProfile } from "../services/patientService";
import { patientPortalPalette as palette } from "../theme/patientPortal";
import { shadow, spacing, typography } from "../theme/tokens";

const pickFirstTruthy = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (value) return String(value);
  }
  return null;
};

const formatRole = (role) => {
  if (!role) return null;
  return String(role)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
};

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const ChoiceChip = ({ label, active, onPress }) => (
  <Pressable
    onPress={onPress}
    style={[styles.choiceChip, active && styles.choiceChipActive]}
  >
    <Text style={[styles.choiceChipText, active && styles.choiceChipTextActive]}>
      {label}
    </Text>
  </Pressable>
);

const PreferenceTile = ({ icon, title, body, toneStyle, onPress }) => (
  <Pressable onPress={onPress} style={styles.preferenceTile}>
    <View style={[styles.preferenceIconWrap, toneStyle]}>
      <Feather name={icon} size={20} color={palette.primary} />
    </View>
    <View style={styles.preferenceCopy}>
      <Text style={styles.preferenceTitle}>{title}</Text>
      <Text style={styles.preferenceBody}>{body}</Text>
    </View>
    <Feather name="chevron-right" size={18} color={palette.textMuted} />
  </Pressable>
);

const toInputValue = (value) => (typeof value === "string" ? value : value ? String(value) : "");

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { signOut, signInWithToken, token, user } = useAuth();
  const { showToast } = useToast();

  const displayName =
    pickFirstTruthy(
      user?.full_name,
      user?.fullName,
      user?.name,
      [user?.first_name, user?.last_name].filter(Boolean).join(" "),
    ) || "Not available";

  const role = formatRole(pickFirstTruthy(user?.role, user?.user_role));

  const facility =
    pickFirstTruthy(
      user?.facility_name,
      user?.facility?.name,
      user?.facility?.facility_name,
      user?.workspace?.facility_name,
      user?.workspace?.name,
    ) || "Not available";

  const patientId = pickFirstTruthy(user?.patient_id, user?.patient_account_id);
  const patientAccountId = pickFirstTruthy(
    user?.user_id,
    user?.patient_account_id,
    user?.auth_user_id,
    user?.id,
  );
  const userId = pickFirstTruthy(user?.user_id, user?.auth_user_id, user?.id);
  const phoneNumber =
    pickFirstTruthy(
      user?.phone_number,
      user?.phone,
      user?.mobile_number,
      user?.contact?.phone_number,
      user?.contact?.phone,
    ) || "Not available";

  const email =
    pickFirstTruthy(user?.email, user?.email_address, user?.contact?.email) ||
    "Not available";

  const [isEditing, setIsEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [form, setForm] = React.useState({
    name: toInputValue(
      pickFirstTruthy(
        user?.full_name,
        user?.fullName,
        user?.name,
        [user?.first_name, user?.last_name].filter(Boolean).join(" "),
      ),
    ),
    date_of_birth: toInputValue(user?.date_of_birth),
    gender: toInputValue(user?.gender || user?.sex).toLowerCase(),
    emergency_contact_name: toInputValue(user?.emergency_contact_name),
    emergency_contact_phone: toInputValue(user?.emergency_contact_phone),
  });

  React.useEffect(() => {
    setForm({
      name: toInputValue(
        pickFirstTruthy(
          user?.full_name,
          user?.fullName,
          user?.name,
          [user?.first_name, user?.last_name].filter(Boolean).join(" "),
        ),
      ),
      date_of_birth: toInputValue(user?.date_of_birth),
      gender: toInputValue(user?.gender || user?.sex).toLowerCase(),
      emergency_contact_name: toInputValue(user?.emergency_contact_name),
      emergency_contact_phone: toInputValue(user?.emergency_contact_phone),
    });
  }, [user]);

  const updateField = React.useCallback((key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  }, []);

  const cancelEditing = React.useCallback(() => {
    setIsEditing(false);
    setError("");
    setForm({
      name: toInputValue(
        pickFirstTruthy(
          user?.full_name,
          user?.fullName,
          user?.name,
          [user?.first_name, user?.last_name].filter(Boolean).join(" "),
        ),
      ),
      date_of_birth: toInputValue(user?.date_of_birth),
      gender: toInputValue(user?.gender || user?.sex).toLowerCase(),
      emergency_contact_name: toInputValue(user?.emergency_contact_name),
      emergency_contact_phone: toInputValue(user?.emergency_contact_phone),
    });
  }, [user]);

  const saveProfile = React.useCallback(async () => {
    if (!form.name.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!form.gender || !["male", "female"].includes(form.gender)) {
      setError("Select male or female.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await updatePatientProfile(patientAccountId, {
        name: form.name.trim(),
        date_of_birth: form.date_of_birth.trim() || undefined,
        gender: form.gender,
        emergency_contact_name: form.emergency_contact_name.trim() || undefined,
        emergency_contact_phone: form.emergency_contact_phone.trim() || undefined,
      });

      const nextProfile = {
        ...user,
        ...(response && typeof response === "object" ? response : {}),
        full_name: form.name.trim(),
        name: form.name.trim(),
        date_of_birth: form.date_of_birth.trim() || null,
        gender: form.gender,
        sex: form.gender,
        emergency_contact_name: form.emergency_contact_name.trim() || null,
        emergency_contact_phone: form.emergency_contact_phone.trim() || null,
      };

      await signInWithToken(token, nextProfile);
      setIsEditing(false);
      showToast("Profile updated successfully.", "success");
    } catch (saveError) {
      setError(saveError?.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  }, [form, patientAccountId, showToast, signInWithToken, token, user]);

  return (
    <Screen backgroundColor={palette.surface}>
      <HeroHeader
        badge="Profile"
        title="My Profile"
        subtitle="Manage your identity, care settings, and account details."
        style={styles.header}
      />

      <Card style={styles.identityCard}>
        <View style={styles.identityAvatar}>
          <Text style={styles.identityAvatarText}>
            {(displayName || "P").charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.identityName}>{displayName}</Text>
        <Text style={styles.identitySubtext}>{phoneNumber}</Text>
        <View style={styles.identityPills}>
          <View style={styles.identityPill}>
            <Text style={styles.identityPillText}>Patient ID: {patientId || "Not available"}</Text>
          </View>
          {role ? (
            <View style={[styles.identityPill, styles.identityPillSecondary]}>
              <Text style={styles.identityPillText}>{role}</Text>
            </View>
          ) : null}
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Primary details</Text>
          {!isEditing ? (
            <Pressable style={styles.inlineAction} onPress={() => setIsEditing(true)}>
              <Feather name="edit-2" size={16} color={palette.primary} />
              <Text style={styles.inlineActionText}>Edit</Text>
            </Pressable>
          ) : null}
        </View>

        {isEditing ? (
          <View style={styles.form}>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Full name</Text>
              <Input value={form.name} onChangeText={(value) => updateField("name", value)} />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Date of birth</Text>
              <Input
                value={form.date_of_birth}
                onChangeText={(value) => updateField("date_of_birth", value)}
                placeholder="YYYY-MM-DD"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Gender</Text>
              <View style={styles.choiceRow}>
                {GENDER_OPTIONS.map((option) => (
                  <ChoiceChip
                    key={option.value}
                    label={option.label}
                    active={form.gender === option.value}
                    onPress={() => updateField("gender", option.value)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Emergency contact name</Text>
              <Input
                value={form.emergency_contact_name}
                onChangeText={(value) => updateField("emergency_contact_name", value)}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Emergency contact phone</Text>
              <Input
                value={form.emergency_contact_phone}
                onChangeText={(value) => updateField("emergency_contact_phone", value)}
                keyboardType="phone-pad"
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.formActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={cancelEditing}
                style={styles.formAction}
              />
              <Button
                title={saving ? "Saving..." : "Save profile"}
                onPress={saveProfile}
                disabled={saving}
                style={styles.formAction}
              />
            </View>
          </View>
        ) : (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Facility</Text>
              <Text style={styles.detailValue}>{facility}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>User ID</Text>
              <Text style={styles.detailValue}>{userId || "Not available"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{email}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone</Text>
              <Text style={styles.detailValue}>{phoneNumber}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date of birth</Text>
              <Text style={styles.detailValue}>{user?.date_of_birth || "Not available"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Gender</Text>
              <Text style={styles.detailValue}>
                {formatRole(user?.gender || user?.sex) || "Not available"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Emergency contact</Text>
              <Text style={styles.detailValue}>
                {pickFirstTruthy(user?.emergency_contact_name) || "Not available"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Emergency phone</Text>
              <Text style={styles.detailValue}>
                {pickFirstTruthy(user?.emergency_contact_phone) || "Not available"}
              </Text>
            </View>
          </>
        )}
      </Card>

      <Card style={styles.preferencesCard}>
        <Text style={styles.cardTitle}>Preferences</Text>
        <PreferenceTile
          icon="shield"
          title="Facility verification"
          body="See where your phone is verified and finish verification where results were detected."
          toneStyle={styles.preferenceBlue}
          onPress={() => navigation.navigate("FacilityVerification")}
        />
        <PreferenceTile
          icon="bell"
          title="Reminders"
          body="Manage medication and appointment alerts."
          toneStyle={styles.preferenceBlue}
        />
        <PreferenceTile
          icon="users"
          title="Caregivers"
          body="Authorized access for family members."
          toneStyle={styles.preferenceGreen}
        />
      </Card>

      <View style={styles.actions}>
        {!isEditing ? (
          <Button title="Update profile" onPress={() => setIsEditing(true)} variant="secondary" />
        ) : null}
        <Button
          title="Sign out"
          onPress={async () => {
            await signOut();
          }}
          variant="ghost"
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.md,
  },
  identityCard: {
    gap: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: palette.surfaceLowest,
    borderColor: "#E0E3E2",
    ...shadow.card,
  },
  identityAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: palette.primaryFixed,
    alignItems: "center",
    justifyContent: "center",
  },
  identityAvatarText: {
    fontSize: 26,
    fontWeight: "800",
    color: palette.primary,
  },
  identityName: {
    fontSize: 24,
    fontWeight: "800",
    color: palette.text,
  },
  identitySubtext: {
    ...typography.body,
    color: palette.textMuted,
  },
  identityPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  identityPill: {
    backgroundColor: palette.surfaceLow,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  identityPillSecondary: {
    backgroundColor: palette.secondaryFixed,
  },
  identityPillText: {
    ...typography.caption,
    color: palette.text,
    fontWeight: "700",
  },
  card: {
    gap: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: palette.surfaceLowest,
    borderColor: "#E0E3E2",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  inlineAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inlineActionText: {
    ...typography.caption,
    color: palette.primary,
    fontWeight: "700",
  },
  form: {
    gap: spacing.md,
  },
  fieldBlock: {
    gap: spacing.xs,
  },
  fieldLabel: {
    ...typography.caption,
    color: palette.textMuted,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  choiceRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  choiceChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.surfaceBorder,
    backgroundColor: palette.surfaceLow,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  choiceChipActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  choiceChipText: {
    ...typography.body,
    color: palette.text,
    fontWeight: "700",
  },
  choiceChipTextActive: {
    color: palette.textOnDark,
  },
  errorText: {
    ...typography.body,
    color: palette.dangerText,
  },
  formActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  formAction: {
    flex: 1,
  },
  preferencesCard: {
    gap: spacing.md,
    backgroundColor: palette.surfaceLowest,
    borderColor: "#E0E3E2",
  },
  cardTitle: {
    ...typography.h3,
  },
  detailRow: {
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#E0E3E2",
  },
  detailLabel: {
    ...typography.caption,
    color: palette.textMuted,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  detailValue: {
    ...typography.body,
    color: palette.text,
  },
  preferenceTile: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  preferenceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  preferenceBlue: {
    backgroundColor: palette.primaryFixed,
  },
  preferenceGreen: {
    backgroundColor: palette.secondaryFixed,
  },
  preferenceCopy: {
    flex: 1,
  },
  preferenceTitle: {
    ...typography.body,
    fontWeight: "700",
    color: palette.text,
  },
  preferenceBody: {
    ...typography.caption,
    color: palette.textMuted,
    marginTop: 2,
  },
  actions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
});

export default ProfileScreen;
