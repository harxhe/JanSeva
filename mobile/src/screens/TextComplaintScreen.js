import { useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { theme } from "../utils/theme";
import ScreenHeader from "../components/ScreenHeader";
import Card from "../components/Card";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import { apiUrl } from "../config/api";

const buildFallbackPreview = (description) => ({
  category: "general",
  priority: "medium",
  translated_text: description,
  source_language: "English",
  fallback: true,
});

const TextComplaintScreen = ({ onBack, onSubmit }) => {
  const [description, setDescription] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handlePreview = async () => {
    if (!description.trim()) return;

    setErrorMessage("");

    try {
      setLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(apiUrl("/api/interactions/preview"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message_text: description,
        }),
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Preview request failed with ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        setPreview(data.data);
      } else {
        throw new Error(data.error || "Preview request was not successful");
      }
    } catch (error) {
      console.error(error);
      setPreview(buildFallbackPreview(description));
      setErrorMessage("We could not fetch the AI review right now, so you can file using the original text.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    const payload = {
      title: "New issue reported",
      category: preview?.category || "Pending Classification",
      priority: preview?.priority || "medium",
      summary: description,
      translatedText: preview?.translated_text || description,
      language: preview?.source_language || "English",
    };

    await onSubmit(payload);
    setPreview(null);
    setDescription("");
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Text Complaint"
        subtitle="Review the predicted category before you file it."
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

        {!preview ? (
          <PrimaryButton
            label={loading ? "Analyzing..." : "Review complaint"}
            onPress={handlePreview}
            disabled={loading || !description.trim()}
          />
        ) : (
          <View style={styles.previewWrap}>
            <Text style={styles.sectionTitle}>Review before filing</Text>
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            <View style={styles.metaRow}>
              <Text style={styles.metaChip}>Category: {preview.category}</Text>
              <Text style={styles.metaChip}>Priority: {preview.priority}</Text>
            </View>
            <Text style={styles.label}>English translation</Text>
            <Text style={styles.previewText}>{preview.translated_text || description}</Text>
            <Text style={styles.helperText}>
              Your complaint will be filed under {preview.category}.
            </Text>
            <View style={styles.actionRow}>
              <View style={styles.actionButton}>
                <PrimaryButton
                  label="Edit"
                  variant="secondary"
                  onPress={() => setPreview(null)}
                />
              </View>
              <View style={styles.actionButton}>
                <PrimaryButton label="Confirm & File" onPress={handleConfirm} />
              </View>
            </View>
          </View>
        )}
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
  previewWrap: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.ink,
  },
  label: {
    fontSize: 12,
    color: theme.colors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  previewText: {
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.softAlt,
    color: theme.colors.ink,
    lineHeight: 22,
  },
  helperText: {
    color: theme.colors.inkMuted,
    fontSize: 13,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  metaChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.soft,
    color: theme.colors.primary,
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

export default TextComplaintScreen;
