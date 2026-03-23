import { View, Text, TextInput, StyleSheet } from "react-native";
import { theme } from "../utils/theme";

const InputField = ({ label, value, onChangeText, placeholder, multiline }) => {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.inkMuted}
        style={[styles.input, multiline && styles.multiline]}
        multiline={multiline}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    color: theme.colors.inkMuted,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 12,
    color: theme.colors.ink,
    backgroundColor: theme.colors.surface,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: "top",
  },
});

export default InputField;
