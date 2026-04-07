import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
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
  medicationName,
  facilityName,
  timesPerDay,
  startTime,
  generatedTimes,
  saving,
  error,
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
          <Text style={styles.eyebrow}>Medication reminders</Text>
          <Text style={styles.title}>Schedule your medications</Text>
          <Text style={styles.body}>
            {medicationName || "Medication"} from {facilityName || "your facility"} can be
            scheduled now. Choose how many times per day and the first dose time.
          </Text>

          <View style={styles.section}>
            <Text style={styles.label}>How many times per day?</Text>
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
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>First dose time</Text>
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
            <Text style={styles.helpText}>
              Start with the closest time, then the rest of the doses are spaced evenly.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Daily schedule</Text>
            <View style={styles.timeGrid}>
              {generatedTimes.map((time, index) => (
                <View key={`${time.label}-${index}`} style={styles.timeChip}>
                  <Text style={styles.timeChipLabel}>Dose {index + 1}</Text>
                  <Text style={styles.timeChipValue}>{time.label}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.helpText}>
              Times are spaced evenly across the day and update automatically when you change
              the first dose or daily count.
            </Text>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.actions}>
            <Button
              title="Not now"
              variant="secondary"
              onPress={onDismiss}
              style={styles.actionButton}
            />
            <Button
              title={saving ? "Saving..." : "Save reminders"}
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
    ...shadow.card,
  },
  eyebrow: {
    ...typography.caption,
    color: palette.primary,
    fontWeight: "700",
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  title: {
    ...typography.h2,
    color: palette.text,
    marginBottom: spacing.xs,
  },
  body: {
    ...typography.body,
    color: palette.textMuted,
    lineHeight: 22,
  },
  section: {
    marginTop: spacing.lg,
  },
  label: {
    ...typography.body,
    color: palette.text,
    fontWeight: "700",
    marginBottom: spacing.sm,
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
  helpText: {
    ...typography.caption,
    color: palette.textMuted,
    marginTop: spacing.xs,
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
