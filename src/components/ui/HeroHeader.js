import React from "react";

import { View, Text, StyleSheet } from "react-native";

import { colors, spacing, typography } from "../../theme/tokens";

const HeroHeader = ({ badge, eyebrow, title, subtitle, style }) => {
  return (
    <View style={[styles.container, style]}>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.secondarySoft,
    marginBottom: spacing.md,
  },
  badgeText: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  eyebrow: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});

export default HeroHeader;
