import { View, Text, Switch, StyleSheet } from "react-native";
import { theme } from "../utils/theme";

const ToggleRow = ({ title, description, value, onValueChange }) => {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.ink,
  },
  description: {
    fontSize: 12,
    color: theme.colors.inkMuted,
    marginTop: 4,
  },
});

export default ToggleRow;
