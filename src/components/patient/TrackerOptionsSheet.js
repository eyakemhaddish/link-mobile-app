import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import Button from "../ui/Button";
import { patientPortalPalette as palette } from "../../theme/patientPortal";
import { radius, shadow, spacing, typography } from "../../theme/tokens";

const ACCENT_STYLES = {
  blue: {
    iconWrap: { backgroundColor: palette.primaryFixed },
    iconColor: palette.primary,
  },
  sand: {
    iconWrap: { backgroundColor: palette.secondaryFixed },
    iconColor: palette.secondary,
  },
  neutral: {
    iconWrap: { backgroundColor: palette.surfaceLow },
    iconColor: palette.text,
  },
};

const TrackerOptionsSheet = ({
  visible,
  item,
  actions,
  bluetoothPreset,
  onSelectAction,
  onClose,
}) => {
  if (!item) return null;

  const accent = ACCENT_STYLES[item.accent] || ACCENT_STYLES.neutral;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTap} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.grabber} />

          <View style={styles.headerRow}>
            <View style={[styles.iconWrap, accent.iconWrap]}>
              <Feather name={item.icon} size={22} color={accent.iconColor} />
            </View>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
          </View>

          <View style={styles.actionsList}>
            {actions.map((action) => (
              <Pressable
                key={action.id}
                onPress={() => action.available && onSelectAction(action.id)}
                style={[
                  styles.actionCard,
                  !action.available && styles.actionCardDisabled,
                ]}
              >
                <View style={styles.actionCopy}>
                  <Text style={styles.actionTitle}>{action.label}</Text>
                  <Text style={styles.actionDescription}>{action.description}</Text>
                </View>
                <Feather
                  name={action.available ? "chevron-right" : "clock"}
                  size={18}
                  color={action.available ? palette.primary : palette.textMuted}
                />
              </Pressable>
            ))}
          </View>

          {bluetoothPreset ? (
            <View style={styles.bluetoothCard}>
              <Text style={styles.bluetoothTitle}>{bluetoothPreset.title}</Text>
              {bluetoothPreset.steps.map((step) => (
                <Text key={step} style={styles.bluetoothStep}>
                  • {step}
                </Text>
              ))}
              <Text style={styles.bluetoothHint}>{bluetoothPreset.message}</Text>
            </View>
          ) : null}

          <Button title="Close" variant="secondary" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.32)",
  },
  backdropTap: {
    flex: 1,
  },
  sheet: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.card,
  },
  grabber: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: palette.surfaceBorder,
    alignSelf: "center",
  },
  headerRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typography.h3,
    color: palette.text,
  },
  subtitle: {
    ...typography.body,
    color: palette.textMuted,
    lineHeight: 21,
  },
  actionsList: {
    gap: spacing.sm,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: palette.surfaceBorder,
    backgroundColor: palette.surfaceLowest,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  actionCardDisabled: {
    opacity: 0.72,
  },
  actionCopy: {
    flex: 1,
    gap: 4,
  },
  actionTitle: {
    ...typography.body,
    color: palette.text,
    fontWeight: "700",
  },
  actionDescription: {
    ...typography.caption,
    color: palette.textMuted,
    lineHeight: 18,
  },
  bluetoothCard: {
    borderWidth: 1,
    borderColor: palette.surfaceBorder,
    backgroundColor: palette.surfaceLow,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  bluetoothTitle: {
    ...typography.body,
    color: palette.text,
    fontWeight: "700",
    marginBottom: 2,
  },
  bluetoothStep: {
    ...typography.caption,
    color: palette.textMuted,
    lineHeight: 18,
  },
  bluetoothHint: {
    ...typography.caption,
    color: palette.primary,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
});

export default TrackerOptionsSheet;
