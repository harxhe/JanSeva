import { View, Text, StyleSheet } from "react-native";
import { theme } from "../utils/theme";

const BrandLogo = ({ compact = false, light = false }) => {
  const textColor = light ? "#f8fafc" : theme.colors.ink;
  const subColor = light ? "rgba(248,250,252,0.7)" : theme.colors.inkMuted;

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <View style={[styles.mark, light && styles.markLight, compact && styles.markCompact]}>
        <View style={styles.ring} />
        <View style={styles.stem} />
        <View style={styles.leafLeft} />
        <View style={styles.leafRight} />
      </View>
      <View>
        <Text style={[styles.wordmark, { color: textColor }, compact && styles.wordmarkCompact]}>JANSEVA</Text>
        {!compact ? <Text style={[styles.tagline, { color: subColor }]}>Citizen Complaint Platform</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowCompact: {
    gap: 10,
  },
  mark: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  markCompact: {
    width: 40,
    height: 40,
    borderRadius: 14,
  },
  markLight: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  ring: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#ffffff",
    top: 10,
  },
  stem: {
    position: "absolute",
    width: 4,
    height: 18,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    bottom: 9,
  },
  leafLeft: {
    position: "absolute",
    width: 12,
    height: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.accent,
    left: 11,
    bottom: 11,
    transform: [{ rotate: "-30deg" }],
  },
  leafRight: {
    position: "absolute",
    width: 12,
    height: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.warning,
    right: 11,
    bottom: 11,
    transform: [{ rotate: "30deg" }],
  },
  wordmark: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
  wordmarkCompact: {
    fontSize: 18,
  },
  tagline: {
    fontSize: 11,
    letterSpacing: 0.6,
    marginTop: 2,
  },
});

export default BrandLogo;
