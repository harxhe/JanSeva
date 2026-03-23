import { View, Text, StyleSheet } from "react-native";
import { theme } from "../utils/theme";
import StatusPill from "./StatusPill";

const HistoryItem = ({ item }) => {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.title}>{item.title}</Text>
        <StatusPill label={item.status} />
      </View>
      <Text style={styles.meta}>{item.id} · {item.category}</Text>
      <Text style={styles.summary}>{item.summary}</Text>
      <Text style={styles.time}>{item.createdAt}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.ink,
    flex: 1,
  },
  meta: {
    color: theme.colors.inkMuted,
    fontSize: 12,
  },
  summary: {
    color: theme.colors.ink,
    fontSize: 13,
  },
  time: {
    color: theme.colors.inkMuted,
    fontSize: 11,
  },
});

export default HistoryItem;
