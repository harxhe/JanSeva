import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../utils/theme";

const ActionTile = ({ title, description, onPress, tone = "primary" }) => {
  const toneMap = {
    primary: theme.colors.primary,
    accent: theme.colors.accent,
    warning: theme.colors.warning,
  };

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={[styles.badge, { backgroundColor: `${toneMap[tone]}22` }]}> 
        <Text style={[styles.badgeText, { color: toneMap[tone] }]}>{title}</Text>
      </View>
      <Text style={styles.description}>{description}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    gap: 8,
    flex: 1,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  description: {
    color: theme.colors.inkMuted,
    fontSize: 13,
  },
});

export default ActionTile;
