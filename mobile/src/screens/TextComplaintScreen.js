import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { theme } from "../utils/theme";
import ScreenHeader from "../components/ScreenHeader";
import Card from "../components/Card";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";

const TextComplaintScreen = ({ onBack, onSubmit }) => {
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!description.trim()) return;
    const payload = {
      title: "New issue reported",
      category: "Pending Classification",
      summary: description,
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
        <InputField
          label="What is the issue?"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the issue in detail"
          multiline
        />
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

});

export default TextComplaintScreen;
