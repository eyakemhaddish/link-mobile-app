import React from "react";
import { View, Text, StyleSheet } from "react-native";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Screen from "../components/ui/Screen";
import { useAuth } from "../context/AuthContext";
import { spacing, typography, shadow } from "../theme/tokens";

const palette = {
  primary: "#004277",
  primaryFixed: "#D3E4FF",
  secondaryFixed: "#B1F0CE",
  tertiaryFixed: "#FFDCC5",
  surface: "#F7FAF9",
  surfaceLow: "#F1F4F3",
  surfaceLowest: "#FFFFFF",
  text: "#181C1C",
  textMuted: "#414750",
};

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

const ProfileScreen = () => {
  const { signOut, user } = useAuth();

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

  return (
    <Screen backgroundColor={palette.surface}>
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>Profile</Text>
        </View>
        <Text style={styles.title}>My Profile</Text>
        <Text style={styles.subtitle}>
          Manage your identity, care settings, and account details.
        </Text>
      </View>

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
        <Text style={styles.cardTitle}>Primary details</Text>
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
      </Card>

      <Card style={styles.preferencesCard}>
        <View style={styles.preferenceTile}>
          <View style={[styles.preferenceIconWrap, styles.preferenceBlue]}>
            <Text style={styles.preferenceIcon}>!</Text>
          </View>
          <View style={styles.preferenceCopy}>
            <Text style={styles.preferenceTitle}>Reminders</Text>
            <Text style={styles.preferenceBody}>Manage medication and appointment alerts.</Text>
          </View>
        </View>
        <View style={styles.preferenceTile}>
          <View style={[styles.preferenceIconWrap, styles.preferenceGreen]}>
            <Text style={styles.preferenceIcon}>+</Text>
          </View>
          <View style={styles.preferenceCopy}>
            <Text style={styles.preferenceTitle}>Caregivers</Text>
            <Text style={styles.preferenceBody}>Authorized access for family members.</Text>
          </View>
        </View>
      </Card>

      <View style={styles.actions}>
        <Button title="Update profile" onPress={() => {}} variant="secondary" />
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
    gap: spacing.xs,
  },
  headerBadge: {
    alignSelf: "flex-start",
    backgroundColor: palette.tertiaryFixed,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerBadgeText: {
    ...typography.caption,
    color: "#713700",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: palette.primary,
    marginBottom: 4,
    fontFamily: "Manrope",
  },
  subtitle: {
    fontSize: 13,
    color: palette.textMuted,
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
    fontFamily: "Manrope",
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
  preferencesCard: {
    gap: spacing.md,
    backgroundColor: palette.surfaceLowest,
    borderColor: "#E0E3E2",
  },
  cardTitle: {
    ...typography.h3,
    fontFamily: "Manrope",
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
  preferenceIcon: {
    fontSize: 22,
    fontWeight: "800",
    color: palette.primary,
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
