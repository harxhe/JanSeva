import { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { theme } from "../utils/theme";
import ScreenHeader from "../components/ScreenHeader";
import Card from "../components/Card";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import { categories } from "../data/mockData";

const TextComplaintScreen = ({ onBack, onSubmit }) => {
  const [category, setCategory] = useState(categories[0]);
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    const payload = {
      title: `${category} issue reported`,
      category,
      summary: description || "No description provided.",
    };
    onSubmit(payload);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Text Complaint"
        subtitle="Send a structured report with optional photo."
        onBack={onBack}
      />
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Select Category</Text>
        <View style={styles.tagRow}>
          {categories.map((item) => (
            <Pressable
              key={item}
              onPress={() => setCategory(item)}
              style={[styles.tag, category === item && styles.tagActive]}
            >
              <Text style={[styles.tagText, category === item && styles.tagTextActive]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
        <InputField
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the issue in detail"
          multiline
        />
        <PrimaryButton label="Upload photo (optional)" variant="secondary" onPress={() => {}} />
        <PrimaryButton label="Submit complaint" onPress={handleSubmit} />
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  card: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.ink,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
  },
  tagActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.soft,
  },
  tagText: {
    fontSize: 12,
    color: theme.colors.inkMuted,
  },
  tagTextActive: {
    color: theme.colors.primary,
    fontWeight: "600",
  },
});

export default TextComplaintScreen;
