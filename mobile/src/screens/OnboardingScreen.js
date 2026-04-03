import { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { theme } from "../utils/theme";
import Card from "../components/Card";
import PrimaryButton from "../components/PrimaryButton";

const SLIDES = [
  {
    kicker: "Welcome",
    title: "Report civic issues in minutes",
    body: "Submit complaints by text or voice, review the AI summary, and send them to the dashboard without a long form.",
    accent: "Text + Voice",
  },
  {
    kicker: "AI Assist",
    title: "See the transcript, translation, and category",
    body: "Before you file a complaint, the app shows the transcription, English translation, category, and urgency picked by AI.",
    accent: "Review before filing",
  },
  {
    kicker: "Tracking",
    title: "Follow every complaint from one place",
    body: "Open your complaint history anytime to see what you submitted and the latest status available from the backend.",
    accent: "History + updates",
  },
];

const OnboardingScreen = ({ onFinish }) => {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  const progressLabel = useMemo(() => `${index + 1} / ${SLIDES.length}`, [index]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.brand}>Samadhan</Text>
        <Pressable onPress={onFinish} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <Card style={styles.heroCard}>
        <View style={styles.artPanel}>
          <View style={styles.glowOrb} />
          <View style={styles.accentPill}>
            <Text style={styles.accentPillText}>{slide.accent}</Text>
          </View>
          <View style={styles.mockCardLarge}>
            <Text style={styles.mockCardTitle}>Smart complaint flow</Text>
            <Text style={styles.mockCardText}>Capture issue -> AI review -> Dashboard</Text>
          </View>
          <View style={styles.mockCardSmall}>
            <Text style={styles.mockCardMeta}>Live category detection</Text>
          </View>
        </View>

        <View style={styles.copyWrap}>
          <Text style={styles.kicker}>{slide.kicker}</Text>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.body}>{slide.body}</Text>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.dotsRow}>
            {SLIDES.map((item, dotIndex) => (
              <View
                key={item.title}
                style={[styles.dot, dotIndex === index && styles.dotActive]}
              />
            ))}
          </View>
          <Text style={styles.progressText}>{progressLabel}</Text>
        </View>

        <View style={styles.actionRow}>
          {index > 0 ? (
            <View style={styles.actionButton}>
              <PrimaryButton label="Back" variant="secondary" onPress={() => setIndex(index - 1)} />
            </View>
          ) : (
            <View style={styles.actionButton} />
          )}
          <View style={styles.actionButton}>
            <PrimaryButton
              label={isLast ? "Go to homepage" : "Next"}
              onPress={() => (isLast ? onFinish() : setIndex(index + 1))}
            />
          </View>
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 18,
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: {
    textTransform: "uppercase",
    letterSpacing: 3,
    color: theme.colors.inkMuted,
    fontSize: 12,
  },
  skipButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  skipText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  heroCard: {
    gap: 20,
    padding: 22,
  },
  artPanel: {
    minHeight: 220,
    borderRadius: theme.radius.lg,
    backgroundColor: "#0f172a",
    overflow: "hidden",
    padding: 18,
    justifyContent: "space-between",
  },
  glowOrb: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(38, 179, 137, 0.18)",
    top: -40,
    right: -30,
  },
  accentPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  accentPillText: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "700",
  },
  mockCardLarge: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.92)",
    gap: 6,
    width: "88%",
  },
  mockCardSmall: {
    alignSelf: "flex-end",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  mockCardTitle: {
    color: theme.colors.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  mockCardText: {
    color: theme.colors.inkMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  mockCardMeta: {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "600",
  },
  copyWrap: {
    gap: 10,
  },
  kicker: {
    color: theme.colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1.6,
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    color: theme.colors.ink,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
  },
  body: {
    color: theme.colors.inkMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: theme.colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: theme.colors.primary,
  },
  progressText: {
    color: theme.colors.inkMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});

export default OnboardingScreen;
