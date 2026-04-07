import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import Screen from "../components/ui/Screen";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import HeroHeader from "../components/ui/HeroHeader";
import { colors, spacing, typography, radius, shadow } from "../theme/tokens";
import { getActiveVisit } from "../services/patientService";
import { useFeatureFlags } from "../context/FeatureFlagsContext";
import { formatVisitForDisplay } from "../utils/journeyMapper";

const QUICK_PROMPTS = [
  {
    id: "symptoms-now",
    label: "Check symptoms now",
    prompt: "I have symptoms and need guidance on what to do next.",
  },
  {
    id: "medicine-question",
    label: "Medication question",
    prompt: "I have a question about my medicine, side effects, and what warning signs I should watch for.",
  },
  {
    id: "lab-question",
    label: "Understand lab results",
    prompt: "Help me understand my recent lab result and whether I should return to clinic.",
  },
  {
    id: "care-seeking",
    label: "Should I seek care now?",
    prompt: "Based on my current symptoms, should I seek care now or monitor at home?",
  },
];

const SymptomCheckerScreen = ({ navigation }) => {
  const { linkAgentMvp } = useFeatureFlags();
  const [activeVisit, setActiveVisit] = useState(null);
  const [loadingVisit, setLoadingVisit] = useState(true);

  const loadActiveVisit = useCallback(async () => {
    try {
      const response = await getActiveVisit();
      setActiveVisit(response?.activeVisit || null);
    } catch (error) {
      setActiveVisit(null);
    } finally {
      setLoadingVisit(false);
    }
  }, []);

  useEffect(() => {
    loadActiveVisit();
  }, [loadActiveVisit]);

  const openGuidedChat = useCallback(
    (starterPrompt, autoSend = false) => {
      navigation.navigate("SymptomCheckerConversational", {
        starterPrompt,
        autoSend,
      });
    },
    [navigation]
  );

  const openFacilities = useCallback(() => {
    const routeNames = navigation?.getState?.()?.routeNames || [];
    if (routeNames.includes("Care")) {
      navigation.navigate("Care");
      return;
    }
    navigation.navigate("Main", { screen: "Care" });
  }, [navigation]);

  const openAppointments = useCallback(() => {
    navigation.navigate("PatientAppointments", {
      startBooking: true,
    });
  }, [navigation]);

  const openRecords = useCallback(() => {
    navigation.navigate("PatientHealthRecords");
  }, [navigation]);

  const formattedActiveVisit = activeVisit ? formatVisitForDisplay(activeVisit) : null;
  const currentStageLabel = formattedActiveVisit?.currentStage || "In progress";
  const lastUpdatedLabel = formattedActiveVisit?.currentStageUpdatedLabel || null;

  return (
    <Screen>
      <HeroHeader
        badge="Guided care"
        title={linkAgentMvp ? "Link Agent" : "Symptom Checker"}
        subtitle="Ask health questions, check symptoms, and move directly to care when needed."
        style={styles.header}
      />

      <Card style={styles.agentCard}>
        <Text style={styles.cardLabel}>
          {linkAgentMvp ? "Link Agent + CDSS safety checks" : "Guided symptom support"}
        </Text>
        <Text style={styles.cardBody}>
          This assistant helps with symptom understanding, care-seeking advice, and follow-up questions.
        </Text>
        <Button
          title="Start guided chat"
          onPress={() => openGuidedChat("", false)}
          style={styles.primaryAction}
        />
      </Card>

      <Text style={styles.sectionTitle}>Quick prompts</Text>
      <View style={styles.promptGrid}>
        {QUICK_PROMPTS.map((prompt) => (
          <Pressable
            key={prompt.id}
            onPress={() => openGuidedChat(prompt.prompt, true)}
            style={styles.promptCard}
          >
            <Text style={styles.promptLabel}>{prompt.label}</Text>
            <Text style={styles.promptHint}>Send to Link Agent</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Care handoff</Text>
      <Card style={styles.handoffCard}>
        {loadingVisit ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Checking your current care context...</Text>
          </View>
        ) : activeVisit ? (
          <Text style={styles.handoffBody}>
            You have an active visit at <Text style={styles.handoffStrong}>{currentStageLabel}</Text>. Ask follow-up
            questions, then open records or continue care handoff.
            {lastUpdatedLabel ? ` Last update: ${lastUpdatedLabel}.` : ""}
          </Text>
        ) : (
          <Text style={styles.handoffBody}>
            No active visit found. If symptoms are concerning, connect to a linked clinic and request care.
          </Text>
        )}
        <View style={styles.actionRow}>
          <Button title="Find linked clinics" variant="secondary" onPress={openFacilities} style={styles.rowButton} />
          <Button title="Book appointment" onPress={openAppointments} style={styles.rowButton} />
        </View>
        <Button title="Open records" variant="ghost" onPress={openRecords} style={styles.recordsButton} />
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.caption,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "#4C6070",
  },
  agentCard: {
    marginBottom: spacing.sm,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E0E6EA",
    shadowColor: "#004277",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  cardLabel: {
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    color: "#005A9E",
    marginBottom: spacing.sm,
    fontWeight: "800",
  },
  cardBody: {
    ...typography.body,
    marginBottom: spacing.md,
    color: "#53626E",
    lineHeight: 22,
  },
  primaryAction: {
    alignSelf: "flex-start",
  },
  promptGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  promptCard: {
    width: "48%",
    minHeight: 92,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#DCE5EA",
    backgroundColor: "#F7FAF9",
    padding: spacing.md,
    justifyContent: "space-between",
    shadowColor: "#004277",
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  promptLabel: {
    ...typography.body,
    fontWeight: "600",
    color: "#18384C",
  },
  promptHint: {
    ...typography.caption,
    color: "#68808F",
  },
  handoffCard: {
    marginTop: spacing.xs,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E0E6EA",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  loadingText: {
    ...typography.caption,
    color: "#68808F",
  },
  handoffBody: {
    ...typography.body,
    marginBottom: spacing.sm,
    color: "#53626E",
    lineHeight: 22,
  },
  handoffStrong: {
    fontWeight: "700",
    color: "#005A9E",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  rowButton: {
    flex: 1,
    minWidth: 140,
  },
  recordsButton: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
  },
});

export default SymptomCheckerScreen;
