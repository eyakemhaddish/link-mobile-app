import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Screen from "../components/ui/Screen";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { colors, spacing, typography } from "../theme/tokens";
import { useAuth } from "../context/AuthContext";

const ProfileScreen = () => {
  const { signOut, user, token } = useAuth();
  const displayName = user?.full_name || "Patient";
  const facility = user?.facility_name || "Addis Ababa";
  const patientId = user?.patient_id || user?.id || "-";
  const userId = user?.user_id || "-";
  const phoneNumber = user?.phone_number || user?.phone || "-";
  const sessionPreview =
    typeof token === "string" && token.length > 18
      ? `${token.slice(0, 18)}...`
      : token || "-";

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
        <Text style={styles.cardBody}>{displayName} - {facility}</Text>
        <Text style={styles.meta}>Patient ID: {patientId}</Text>
        <Text style={styles.meta}>User ID: {userId}</Text>
        <Text style={styles.meta}>Phone: {phoneNumber}</Text>
        <Text style={styles.meta}>Session token: {sessionPreview}</Text>

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
