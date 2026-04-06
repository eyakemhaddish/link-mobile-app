import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { colors, spacing, radius, typography } from "../../theme/tokens";

const Button = ({ title, children, onPress, variant = "primary", style, textStyle, disabled = false }) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "ghost" && styles.ghost,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {title ? (
        <Text
          style={[
            styles.text,
            variant === "secondary" && styles.textSecondary,
            variant === "ghost" && styles.textGhost,
            disabled && styles.textDisabled,
            textStyle,
          ]}
        >
          {title}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: colors.primary,
    shadowColor: "#004277",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  secondary: {
    backgroundColor: colors.primaryFixed,
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  pressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.55,
  },
  text: {
    ...typography.body,
    fontWeight: "700",
    color: colors.surface,
  },
  textSecondary: {
    color: colors.primary,
  },
  textGhost: {
    color: colors.primary,
  },
  textDisabled: {
    color: colors.surface,
  },
});

export default Button;
