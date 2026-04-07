import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Button from "../ui/Button";
import { Feather } from "@expo/vector-icons";
import { patientPortalPalette as palette } from "../../theme/patientPortal";
import { radius, shadow, spacing, typography } from "../../theme/tokens";

const DoseButton = ({ active, value, onPress }) => (
  <Pressable
    onPress={() => onPress(value)}
    style={[styles.doseButton, active && styles.doseButtonActive]}
  >
    <Text style={[styles.doseButtonText, active && styles.doseButtonTextActive]}>
      {value}x
    </Text>
  </Pressable>
);

const parseTime = (value) => {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return { hour: 8, minute: 0 };
  const hour = Math.max(0, Math.min(23, Number(match[1])));
  const minute = Math.max(0, Math.min(59, Number(match[2])));
  return { hour, minute };
};

const formatTime = (hour, minute) =>
  `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

const TimeStepper = ({ label, value, step = 1, max, onChange }) => {
  const increment = () => onChange((value + step) % (max + 1));
  const decrement = () => onChange((value - step + (max + 1)) % (max + 1));

  return (
    <View style={styles.timeStepper}>
      <Text style={styles.timeStepperLabel}>{label}</Text>
      <View style={styles.timeStepperControl}>
        <Pressable onPress={decrement} style={styles.timeAdjustButton}>
          <Feather name="minus" size={18} color={palette.primary} />
        </Pressable>
        <Text style={styles.timeStepperValue}>{String(value).padStart(2, "0")}</Text>
        <Pressable onPress={increment} style={styles.timeAdjustButton}>
          <Feather name="plus" size={18} color={palette.primary} />
        </Pressable>
      </View>
    </View>
  );
};

const MedicationReminderSetupModal = ({
  visible,
  title = "Schedule reminder",
  subtitle,
  reminderName,
  reminderNameEditable = false,
  timesPerDay,
  startTime,
  generatedTimes,
  saving,
  error,
  saveLabel = "Save reminders",
  onReminderNameChange,
  onTimesPerDayChange,
  onStartTimeChange,
  onSave,
  onDismiss,
}) => {
  const parsedTime = parseTime(startTime);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.body}>{subtitle}</Text> : null}

            <View style={styles.setupCard}>
              <Text style={styles.setupTitle}>Daily setup</Text>
              <Text style={styles.setupHint}>Pick how many doses and the first time. The rest are spaced automatically.</Text>

              {reminderNameEditable ? (
                <>
                  <Text style={styles.label}>Reminder name</Text>
                  <TextInput
                    value={reminderName}
                    onChangeText={onReminderNameChange}
                    placeholder="What should we remind you about?"
                    placeholderTextColor={palette.textMuted}
                    style={styles.nameInput}
                  />
                </>
              ) : reminderName ? (
                <View style={styles.namePreview}>
                  <Text style={styles.namePreviewLabel}>Reminder</Text>
                  <Text style={styles.namePreviewValue}>{reminderName}</Text>
                </View>
              ) : null}

              <Text style={styles.label}>Times per day</Text>
              <View style={styles.doseRow}>
                {[1, 2, 3, 4, 5, 6].map((value) => (
                  <DoseButton
                    key={value}
                    value={value}
                    active={value === timesPerDay}
                    onPress={onTimesPerDayChange}
                  />
                ))}
              </View>

              <Text style={[styles.label, styles.timeLabel]}>First dose</Text>
              <View style={styles.timeSelector}>
                <TimeStepper
                  label="Hour"
                  value={parsedTime.hour}
                  max={23}
                  onChange={(nextHour) =>
                    onStartTimeChange(formatTime(nextHour, parsedTime.minute))
                  }
                />
                <Text style={styles.timeSeparator}>:</Text>
                <TimeStepper
                  label="Minute"
                  value={parsedTime.minute}
                  max={55}
                  step={5}
                  onChange={(nextMinute) =>
                    onStartTimeChange(formatTime(parsedTime.hour, nextMinute))
                  }
                />
              </View>

              <View style={styles.startTimePreview}>
                <Text style={styles.startTimePreviewLabel}>Starts at</Text>
                <Text style={styles.startTimePreviewValue}>
                  {formatTime(parsedTime.hour, parsedTime.minute)}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.scheduleHeader}>
                <Text style={styles.label}>Daily schedule</Text>
                <Text style={styles.scheduleCount}>{generatedTimes.length} doses</Text>
              </View>
              <View style={styles.timeGrid}>
                {generatedTimes.map((time, index) => (
                  <View key={`${time.label}-${index}`} style={styles.timeChip}>
                    <Text style={styles.timeChipLabel}>Dose {index + 1}</Text>
                    <Text style={styles.timeChipValue}>{time.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.actions}>
            <Button
              title="Not now"
              variant="secondary"
              onPress={onDismiss}
              style={styles.actionButton}
            />
            <Button
              title={saving ? "Saving..." : saveLabel}
              onPress={onSave}
              disabled={saving}
              style={styles.actionButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.48)",
    padding: spacing.lg,
    justifyContent: "center",
  },
  sheet: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: palette.border,
    maxHeight: "88%",
    ...shadow.card,
  },
  scrollArea: {
    maxHeight: "100%",
  },
  scrollContent: {
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: palette.text,
    marginBottom: 4,
  },
  body: {
    ...typography.body,
    color: palette.textMuted,
    lineHeight: 20,
  },
  section: {
    marginTop: spacing.lg,
  },
  setupCard: {
    marginTop: spacing.lg,
    backgroundColor: palette.surfaceLow,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.surfaceBorder,
    padding: spacing.md,
  },
  setupTitle: {
    ...typography.body,
    color: palette.text,
    fontWeight: "700",
  },
  setupHint: {
    ...typography.caption,
    color: palette.textMuted,
    marginTop: 4,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  nameInput: {
    ...typography.body,
    color: palette.text,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.surfaceBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  namePreview: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.surfaceBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  namePreviewLabel: {
    ...typography.caption,
    color: palette.textMuted,
    marginBottom: 4,
  },
  namePreviewValue: {
    ...typography.body,
    color: palette.text,
    fontWeight: "700",
  },
  label: {
    ...typography.body,
    color: palette.text,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  timeLabel: {
    marginTop: spacing.md,
  },
  doseRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  doseButton: {
    minWidth: 52,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.surfaceBorder,
    backgroundColor: palette.surfaceLow,
    alignItems: "center",
  },
  doseButtonActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  doseButtonText: {
    ...typography.body,
    color: palette.text,
    fontWeight: "700",
  },
  doseButtonTextActive: {
    color: palette.textOnDark,
  },
  timeSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  timeStepper: {
    flex: 1,
    backgroundColor: palette.surfaceLow,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.surfaceBorder,
    padding: spacing.sm,
  },
  timeStepperLabel: {
    ...typography.caption,
    color: palette.textMuted,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  timeStepperControl: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeAdjustButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  timeStepperValue: {
    ...typography.h2,
    color: palette.text,
    minWidth: 42,
    textAlign: "center",
  },
  timeSeparator: {
    ...typography.h2,
    color: palette.primary,
    fontWeight: "700",
    marginTop: spacing.lg,
  },
  startTimePreview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.surfaceBorder,
  },
  startTimePreviewLabel: {
    ...typography.caption,
    color: palette.textMuted,
    fontWeight: "700",
  },
  startTimePreviewValue: {
    ...typography.body,
    color: palette.primary,
    fontWeight: "800",
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  scheduleCount: {
    ...typography.caption,
    color: palette.textMuted,
    fontWeight: "700",
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  timeChip: {
    minWidth: "47%",
    backgroundColor: palette.surfaceLow,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.surfaceBorder,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  timeChipLabel: {
    ...typography.caption,
    color: palette.textMuted,
    marginBottom: 4,
  },
  timeChipValue: {
    ...typography.h3,
    color: palette.text,
  },
  errorText: {
    ...typography.body,
    color: palette.dangerText,
    marginTop: spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
});

export default MedicationReminderSetupModal;
