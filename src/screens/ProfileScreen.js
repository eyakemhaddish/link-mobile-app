import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import HeroHeader from "../components/ui/HeroHeader";
import Screen from "../components/ui/Screen";
import { useAuth } from "../context/AuthContext";
import { spacing, typography, shadow } from "../theme/tokens";
import { patientPortalPalette as palette } from "../theme/patientPortal";

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
            <Feather name="bell" size={20} color={palette.primary} />
          </View>
          <View style={styles.preferenceCopy}>
            <Text style={styles.preferenceTitle}>Reminders</Text>
            <Text style={styles.preferenceBody}>Manage medication and appointment alerts.</Text>
          </View>
        </View>
        <View style={styles.preferenceTile}>
          <View style={[styles.preferenceIconWrap, styles.preferenceGreen]}>
            <Feather name="users" size={20} color={palette.primary} />
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
