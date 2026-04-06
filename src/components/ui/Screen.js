import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, StyleSheet, ScrollView } from "react-native";
import { colors, spacing } from "../../theme/tokens";

const Screen = ({ children, variant = "default", style, backgroundColor, scrollable = true }) => {
  const Container = scrollable ? ScrollView : View;

  return (
    <SafeAreaView
      style={[styles.root, backgroundColor && { backgroundColor }]}
    >
      <View pointerEvents="none" style={styles.glowTop} />
      <View pointerEvents="none" style={styles.glowBottom} />
      <Container
        style={[
          styles.container,
          variant === "hero" && styles.hero,
          variant === "tight" && styles.tight,
          style,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </Container>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  glowTop: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(0, 90, 158, 0.08)",
  },
  glowBottom: {
    position: "absolute",
    bottom: -70,
    left: -50,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(44, 105, 78, 0.08)",
  },
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  hero: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  tight: {
    padding: spacing.md,
  },
});

export default Screen;
