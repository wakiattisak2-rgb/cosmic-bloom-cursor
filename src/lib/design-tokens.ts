/** Design tokens — spacing, typography, glass surfaces (reference for new UI). */
export const tokens = {
  fontDisplay: "font-display",
  fontSans: "font-sans",
  fontMono: "font-mono",
  radius: { sm: "rounded-lg", md: "rounded-xl", lg: "rounded-2xl", full: "rounded-full" },
  spacing: { page: "px-4 py-10 sm:px-6", section: "space-y-6", card: "p-5 sm:p-6" },
  surface: { glass: "glass", glow: "glass glow-border" },
} as const;
