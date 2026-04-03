import { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { theme } from "../utils/theme";
import PrimaryButton from "../components/PrimaryButton";
import BrandLogo from "../components/BrandLogo";

const SLIDES = [
  {
    kicker: "Welcome",
    title: "Welcome to JANSEVA",
    body: "Your city complaint companion for reporting civic issues faster and tracking them from one place.",
    cta: "Start tour",
    graphic: "welcome",
  },
  {
    kicker: "Voice + Text",
    title: "Report issues your way",
    body: "Type a complaint or record it in your language. JANSEVA prepares it for submission without a long form.",
    cta: "Next",
    graphic: "input",
  },
  {
    kicker: "AI Review",
    title: "Review transcript, translation, and category",
    body: "Before filing, the app shows what the AI understood so you can confirm the complaint is accurate.",
    cta: "Next",
    graphic: "review",
  },
  {
    kicker: "History",
    title: "Track every complaint in one timeline",
    body: "Open your history to follow updates, revisit summaries, and confirm what was sent to the dashboard.",
    cta: "Go to homepage",
    graphic: "tracking",
  },
];

const IllustrationWelcome = () => (
  <View style={styles.illustrationWrap}>
    <View style={[styles.circleGlow, styles.circleOne]} />
    <View style={[styles.circleGlow, styles.circleTwo]} />
    <View style={styles.cityCard}>
      <View style={styles.cityRow}>
        <View style={[styles.building, styles.tallBuilding]} />
        <View style={[styles.building, styles.mediumBuilding]} />
        <View style={[styles.building, styles.shortBuilding]} />
      </View>
      <View style={styles.road} />
      <View style={styles.signalNode} />
    </View>
    <View style={styles.floatingBadgePrimary}>
      <Text style={styles.floatingBadgeText}>Citizens + Dashboard</Text>
    </View>
  </View>
);

const IllustrationInput = () => (
  <View style={styles.illustrationWrap}>
    <View style={styles.deviceShell}>
      <View style={styles.deviceHeader} />
      <View style={styles.waveRow}>
        <View style={[styles.waveBar, { height: 34 }]} />
        <View style={[styles.waveBar, { height: 52 }]} />
        <View style={[styles.waveBar, { height: 28 }]} />
        <View style={[styles.waveBar, { height: 60 }]} />
        <View style={[styles.waveBar, { height: 42 }]} />
      </View>
      <View style={styles.textLineLong} />
      <View style={styles.textLineShort} />
    </View>
    <View style={styles.floatingMic}>
      <View style={styles.micHead} />
      <View style={styles.micStem} />
    </View>
    <View style={styles.floatingTextCard}>
      <Text style={styles.floatingCardTitle}>Text or Voice</Text>
    </View>
  </View>
);

const IllustrationReview = () => (
  <View style={styles.illustrationWrap}>
    <View style={styles.reviewCardPrimary}>
      <View style={styles.reviewChipRow}>
        <View style={[styles.reviewChip, styles.reviewChipAccent]} />
        <View style={[styles.reviewChip, styles.reviewChipMuted]} />
      </View>
      <View style={styles.reviewLineLong} />
      <View style={styles.reviewLineMedium} />
      <View style={styles.reviewLineShort} />
    </View>
    <View style={styles.reviewCardSecondary}>
      <Text style={styles.reviewLabel}>AI Category</Text>
      <Text style={styles.reviewValue}>Sanitation</Text>
      <Text style={styles.reviewSubValue}>Priority: Medium</Text>
    </View>
    <View style={styles.checkBadge}>
      <Text style={styles.checkBadgeText}>Confirm</Text>
    </View>
  </View>
);

const IllustrationTracking = () => (
  <View style={styles.illustrationWrap}>
    <View style={styles.timelineCard}>
      <View style={styles.timelineRow}>
        <View style={[styles.timelineDot, styles.timelineDotActive]} />
        <View style={styles.timelineTextWrap}>
          <View style={styles.timelineLineLong} />
          <View style={styles.timelineLineShort} />
        </View>
      </View>
      <View style={styles.timelineRow}>
        <View style={[styles.timelineDot, styles.timelineDotMuted]} />
        <View style={styles.timelineTextWrap}>
          <View style={styles.timelineLineLong} />
          <View style={styles.timelineLineShort} />
        </View>
      </View>
      <View style={styles.timelineRow}>
        <View style={[styles.timelineDot, styles.timelineDotWarning]} />
        <View style={styles.timelineTextWrap}>
          <View style={styles.timelineLineLong} />
          <View style={styles.timelineLineShort} />
        </View>
      </View>
    </View>
    <View style={styles.dashboardWindow}>
      <View style={styles.dashboardBar} />
      <View style={styles.dashboardGrid}>
        <View style={styles.dashboardTile} />
        <View style={styles.dashboardTile} />
        <View style={styles.dashboardTileWide} />
      </View>
    </View>
  </View>
);

const renderGraphic = (graphic) => {
  switch (graphic) {
    case "input":
      return <IllustrationInput />;
    case "review":
      return <IllustrationReview />;
    case "tracking":
      return <IllustrationTracking />;
    case "welcome":
    default:
      return <IllustrationWelcome />;
  }
};

const OnboardingScreen = ({ onFinish }) => {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;
  const progressLabel = useMemo(() => `${index + 1} / ${SLIDES.length}`, [index]);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <BrandLogo light compact />
        <Pressable onPress={onFinish} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <View style={styles.heroSection}>{renderGraphic(slide.graphic)}</View>

      <View style={styles.contentSection}>
        <View style={styles.copyWrap}>
          <Text style={styles.kicker}>{slide.kicker}</Text>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.body}>{slide.body}</Text>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.dotsRow}>
            {SLIDES.map((item, dotIndex) => (
              <View key={item.title} style={[styles.dot, dotIndex === index && styles.dotActive]} />
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
              label={slide.cta}
              onPress={() => (isLast ? onFinish() : setIndex(index + 1))}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1220",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 18,
    paddingHorizontal: 6,
  },
  skipButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  skipText: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "600",
  },
  heroSection: {
    flex: 1.15,
    justifyContent: "center",
    paddingTop: 16,
  },
  contentSection: {
    flex: 0.85,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 24,
    gap: 22,
  },
  copyWrap: {
    gap: 10,
  },
  kicker: {
    color: theme.colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1.8,
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    color: theme.colors.ink,
    fontSize: 29,
    lineHeight: 35,
    fontWeight: "800",
  },
  body: {
    color: theme.colors.inkMuted,
    fontSize: 14,
    lineHeight: 22,
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
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: theme.colors.border,
  },
  dotActive: {
    width: 28,
    backgroundColor: theme.colors.primary,
  },
  progressText: {
    color: theme.colors.inkMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  illustrationWrap: {
    flex: 1,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  circleGlow: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(38,179,137,0.14)",
  },
  circleOne: {
    width: 220,
    height: 220,
    top: 30,
    right: 10,
  },
  circleTwo: {
    width: 150,
    height: 150,
    bottom: 40,
    left: 20,
    backgroundColor: "rgba(242,169,59,0.12)",
  },
  cityCard: {
    alignSelf: "center",
    width: "86%",
    height: 220,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 22,
    justifyContent: "flex-end",
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 14,
    marginBottom: 18,
  },
  building: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: 10,
    width: 52,
  },
  tallBuilding: { height: 108 },
  mediumBuilding: { height: 84 },
  shortBuilding: { height: 62 },
  road: {
    height: 16,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  signalNode: {
    position: "absolute",
    right: 28,
    top: 28,
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: theme.colors.accent,
  },
  floatingBadgePrimary: {
    position: "absolute",
    bottom: 22,
    right: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: theme.colors.warning,
  },
  floatingBadgeText: {
    color: theme.colors.ink,
    fontSize: 12,
    fontWeight: "700",
  },
  deviceShell: {
    alignSelf: "center",
    width: "72%",
    height: 250,
    borderRadius: 34,
    backgroundColor: "#f8fafc",
    padding: 20,
    justifyContent: "flex-start",
  },
  deviceHeader: {
    alignSelf: "center",
    width: 70,
    height: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.border,
    marginBottom: 20,
  },
  waveRow: {
    height: 80,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  waveBar: {
    width: 18,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },
  textLineLong: {
    marginTop: 24,
    height: 14,
    borderRadius: 999,
    backgroundColor: theme.colors.soft,
  },
  textLineShort: {
    marginTop: 12,
    width: "62%",
    height: 14,
    borderRadius: 999,
    backgroundColor: theme.colors.softAlt,
  },
  floatingMic: {
    position: "absolute",
    left: 28,
    top: 36,
    width: 78,
    height: 78,
    borderRadius: 999,
    backgroundColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  micHead: {
    width: 18,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#ffffff",
  },
  micStem: {
    width: 5,
    height: 18,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    marginTop: 4,
  },
  floatingTextCard: {
    position: "absolute",
    right: 24,
    bottom: 28,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  floatingCardTitle: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "700",
  },
  reviewCardPrimary: {
    alignSelf: "center",
    width: "84%",
    borderRadius: 26,
    backgroundColor: "#ffffff",
    padding: 20,
    gap: 12,
  },
  reviewChipRow: {
    flexDirection: "row",
    gap: 10,
  },
  reviewChip: {
    height: 28,
    borderRadius: 999,
  },
  reviewChipAccent: {
    width: 92,
    backgroundColor: theme.colors.soft,
  },
  reviewChipMuted: {
    width: 72,
    backgroundColor: theme.colors.softAlt,
  },
  reviewLineLong: {
    height: 14,
    borderRadius: 999,
    backgroundColor: theme.colors.softAlt,
  },
  reviewLineMedium: {
    width: "78%",
    height: 14,
    borderRadius: 999,
    backgroundColor: theme.colors.soft,
  },
  reviewLineShort: {
    width: "54%",
    height: 14,
    borderRadius: 999,
    backgroundColor: theme.colors.softAlt,
  },
  reviewCardSecondary: {
    position: "absolute",
    right: 24,
    bottom: 36,
    width: 140,
    borderRadius: 20,
    backgroundColor: theme.colors.warning,
    padding: 16,
    gap: 4,
  },
  reviewLabel: {
    color: theme.colors.inkMuted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  reviewValue: {
    color: theme.colors.ink,
    fontSize: 18,
    fontWeight: "800",
  },
  reviewSubValue: {
    color: theme.colors.ink,
    fontSize: 12,
    fontWeight: "600",
  },
  checkBadge: {
    position: "absolute",
    left: 26,
    top: 34,
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  checkBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  timelineCard: {
    alignSelf: "flex-start",
    width: "62%",
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.92)",
    padding: 18,
    gap: 16,
  },
  timelineRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 999,
    marginTop: 4,
  },
  timelineDotActive: { backgroundColor: theme.colors.accent },
  timelineDotMuted: { backgroundColor: theme.colors.primary },
  timelineDotWarning: { backgroundColor: theme.colors.warning },
  timelineTextWrap: {
    flex: 1,
    gap: 8,
  },
  timelineLineLong: {
    height: 12,
    borderRadius: 999,
    backgroundColor: theme.colors.softAlt,
  },
  timelineLineShort: {
    width: "72%",
    height: 12,
    borderRadius: 999,
    backgroundColor: theme.colors.soft,
  },
  dashboardWindow: {
    position: "absolute",
    right: 22,
    bottom: 28,
    width: 150,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 16,
    gap: 12,
  },
  dashboardBar: {
    height: 10,
    width: 64,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dashboardGrid: {
    gap: 8,
  },
  dashboardTile: {
    height: 28,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  dashboardTileWide: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.24)",
  },
});

export default OnboardingScreen;
