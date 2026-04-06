export const colors = {
  primary: "#005A9E",
  primaryDark: "#004277",
  primarySoft: "#D7E8FF",
  primaryFixed: "#D3E4FF",
  secondary: "#2C694E",
  secondarySoft: "#DFF2E8",
  ink: "#18384C",
  text: "#18384C",
  textSecondary: "#53626E",
  muted: "#68808F",
  border: "#DCE5EA",
  borderStrong: "#C8D6DF",
  surface: "#FFFFFF",
  surfaceSoft: "#F4F7F8",
  background: "#F7FAF9",
  success: "#0F766E",
  warning: "#B45309",
  danger: "#B91C1C",
  dangerSoft: "#FFF1F1",
  green: "#B9F0D8",
};

export const typography = {
  h1: { fontSize: 30, fontWeight: "800", color: colors.ink },
  h2: { fontSize: 22, fontWeight: "700", color: colors.ink },
  h3: { fontSize: 17, fontWeight: "700", color: colors.ink },
  body: { fontSize: 14, color: colors.text },
  caption: { fontSize: 12, color: colors.muted },
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 22,
  xl: 28,
};

export const shadow = {
  card: {
    shadowColor: "#004277",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
};

// Convenience aggregate — HEW screens import `{ tokens }`
export const tokens = {
  colors,
  typography,
  spacing,
  radii: radius,
  shadow,
};
