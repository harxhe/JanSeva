import { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { theme } from "../utils/theme";
import PrimaryButton from "../components/PrimaryButton";

const SLIDES = [
  {
    eyebrow: "Welcome",
    title: "JANSEVA",
    body: "A simple way to report civic issues, review AI assistance, and send complaints to the city dashboard.",
    points: ["Text complaints", "Voice complaints", "Clean tracking"],
  },
  {
    eyebrow: "Report Fast",
    title: "File complaints by text or voice",
    body: "Choose the format that feels easiest, then submit without filling long forms.",
    points: ["Type the issue", "Record in your language", "Review before filing"],
  },
  {
    eyebrow: "AI Review",
    title: "See transcript, translation, and category",
    body: "Before you confirm, JANSEVA shows the AI transcription, English translation, category, and urgency.",
    points: ["Better clarity", "Category prediction", "Priority detection"],
  },
  {
    eyebrow: "Track Progress",
    title: "Keep every complaint in one place",
    body: "Open your history anytime to see what was filed and the latest status from the backend.",
    points: ["Complaint history", "Latest status", "Clear follow-up"],
  },
];

const OnboardingScreen = ({ onFinish }) => {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isFirst = index === 0;
  const isLast = index === SLIDES.length - 1;

  return (
    <View style={styles.screen}>
      <View style={styles.topRow}>
        <Text style={styles.brand}>JANSEVA</Text>
        {!isLast ? (
          <Pressable onPress={onFinish} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        ) : (
          <View style={styles.skipSpacer} />
        )}
      </View>

      <View style={styles.heroArea}>
        <View style={styles.heroBackdrop}>
          <View style={styles.heroOrbPrimary} />
          <View style={styles.heroOrbSecondary} />
          <View style={styles.heroFrame}>
            <Text style={styles.heroKicker}>{slide.eyebrow}</Text>
            <Text style={styles.heroTitle}>{slide.title}</Text>
            <Text style={styles.heroBody}>{slide.body}</Text>
          </View>
        </View>

        <View style={styles.pointsWrap}>
          {slide.points.map((point) => (
            <View key={point} style={styles.pointChip}>
              <Text style={styles.pointChipText}>{point}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.bottomArea}>
        <View style={styles.progressRow}>
          <View style={styles.dotsRow}>
            {SLIDES.map((item, dotIndex) => (
              <View key={item.title} style={[styles.dot, dotIndex === index && styles.dotActive]} />
            ))}
          </View>
          <Text style={styles.progressText}>{index + 1} / {SLIDES.length}</Text>
        </View>

        <View style={styles.actionRow}>
          {!isFirst ? (
            <View style={styles.actionButton}>
              <PrimaryButton label="Back" variant="secondary" onPress={() => setIndex(index - 1)} />
            </View>
          ) : (
            <View style={styles.actionButton} />
          )}
          <View style={styles.actionButton}>
            <PrimaryButton
              label={isLast ? "Enter JANSEVA" : "Next"}
              onPress={() => (isLast ? onFinish() : setIndex(index + 1))}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: theme.spacing.xl,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 3,
  },
  skipButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  skipSpacer: {
    width: 64,
  },
  skipText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  heroArea: {
    flex: 1,
    justifyContent: "center",
    gap: 24,
  },
  heroBackdrop: {
    minHeight: 420,
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: "center",
    padding: 28,
  },
  heroOrbPrimary: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: "rgba(17, 27, 47, 0.08)",
    top: -70,
    right: -60,
  },
  heroOrbSecondary: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(38, 179, 137, 0.12)",
    bottom: -70,
    left: -30,
  },
  heroFrame: {
    gap: 14,
    maxWidth: 460,
  },
  heroKicker: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: theme.colors.ink,
    fontSize: 38,
    lineHeight: 44,
    fontWeight: "800",
  },
  heroBody: {
    color: theme.colors.inkMuted,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 520,
  },
  pointsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  pointChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pointChipText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  bottomArea: {
    gap: 16,
  },
  progressRow: {
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
