import React from "react";
import { View, Text, StyleSheet } from "react-native";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Screen from "../components/ui/Screen";
import { useAuth } from "../context/AuthContext";
import { colors, spacing, typography } from "../theme/tokens";

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
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
        <Text style={styles.subtitle}>
          Manage your health records and preferences.
        </Text>
      </View>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Primary details</Text>
        <Text style={styles.cardBody}>
          {displayName} - {facility}
        </Text>
        <Text style={styles.meta}>Role: {role || "Not available"}</Text>
        <Text style={styles.meta}>
          Patient ID: {patientId || "Not available"}
        </Text>
        <Text style={styles.meta}>User ID: {userId || "Not available"}</Text>
        <Text style={styles.meta}>Email: {email}</Text>
        <Text style={styles.meta}>Phone: {phoneNumber}</Text>

        <Button title="Update profile" onPress={() => {}} variant="secondary" />
        <Button
          title="Sign out"
          onPress={async () => {
            await signOut();
          }}
          variant="ghost"
        />
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
  },
  card: {
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.h3,
  },
  cardBody: {
    ...typography.body,
  },
  meta: {
    ...typography.caption,
    color: colors.muted,
  },
});

export default ProfileScreen;
