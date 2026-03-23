import { View, Text, StyleSheet } from "react-native";
import { theme } from "../utils/theme";

const StatusPill = ({ label }) => {
  const colorMap = {
    New: theme.colors.accent,
    "In Review": theme.colors.warning,
    Assigned: theme.colors.primary,
    Resolved: theme.colors.accent,
  };
  const tint = colorMap[label] || theme.colors.primary;

  return (
    <View style={[styles.pill, { backgroundColor: `${tint}22` }]}> 
      <Text style={[styles.text, { color: tint }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  text: {
    fontSize: 11,
    fontWeight: "700",
  },
});

export default StatusPill;
