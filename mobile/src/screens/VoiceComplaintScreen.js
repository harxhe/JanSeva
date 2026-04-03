import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { theme } from "../utils/theme";
import ScreenHeader from "../components/ScreenHeader";
import Card from "../components/Card";
import PrimaryButton from "../components/PrimaryButton";
import { Audio } from "expo-av";
import { apiUrl } from "../config/api";

const LANGUAGE_OPTIONS = [
  "English",
  "Hindi",
  "Bengali",
  "Tamil",
  "Telugu",
  "Marathi",
];

const VoiceComplaintScreen = ({ onBack, onSubmit }) => {
  const [step, setStep] = useState("record");
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [transcript, setTranscript] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [predictedCategory, setPredictedCategory] = useState("pending classification");
  const [predictedPriority, setPredictedPriority] = useState("medium");
  const [recording, setRecording] = useState(null);
  const [audioUri, setAudioUri] = useState("");
  const [transcriptConfidence, setTranscriptConfidence] = useState(null);
  const [transcriptionModelName, setTranscriptionModelName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [recording]);

  const resetPreview = () => {
    setTranscript("");
    setTranslatedText("");
    setPredictedCategory("pending classification");
    setPredictedPriority("medium");
    setAudioUri("");
    setTranscriptConfidence(null);
    setTranscriptionModelName("");
    setErrorMessage("");
    setStep("record");
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === "granted") {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        const { recording: nextRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(nextRecording);
        setStep("recording");
      }
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecordingAndTranscribe = async () => {
    try {
      setStep("transcribing");
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setAudioUri(uri || "");
      setErrorMessage("");

      if (!uri) {
        setTranscript("Could not access the recorded audio. Please try again.");
        setTranslatedText("");
        setErrorMessage("The recording was not saved correctly on the device.");
        setStep("confirm");
        return;
      }

      const formData = new FormData();
      formData.append("audio", {
        uri,
        name: uri.split("/").pop() || "complaint.m4a",
        type: "audio/mp4",
      });
      formData.append("language", selectedLanguage);

      const res = await fetch(apiUrl("/api/interactions/voice/transcribe"), {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setTranscript(data.transcript || "");
        setTranslatedText(data.translated_text || data.transcript || "");
        setPredictedCategory(data.category || "general");
        setPredictedPriority(data.priority || "medium");
        setTranscriptConfidence(data.confidence ?? null);
        setTranscriptionModelName(data.model_name || "");
        setErrorMessage("");
      } else {
        setTranscript("");
        setTranslatedText("");
        setErrorMessage(data.error || data.message || "Transcription failed. Please try again.");
      }

      setStep("confirm");
    } catch (err) {
      console.error(err);
      setTranscript("");
      setTranslatedText("");
      setErrorMessage("Could not reach the server for transcription. Please try again.");
      setStep("confirm");
    }
  };

  const handleConfirm = async () => {
    const payload = {
      title: "Voice issue reported",
      category: predictedCategory,
      priority: predictedPriority,
      summary: transcript,
      translatedText,
      submissionMode: "voice",
      audioUri,
      transcriptConfidence,
      transcriptionModelName,
      language: selectedLanguage,
    };

    await onSubmit(payload);
    resetPreview();
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Voice Complaint"
        subtitle="Choose a language, record, review the AI preview, then file it."
        onBack={onBack}
      />
      <Card style={styles.card}>
        {step === "record" && (
          <View style={styles.centerBox}>
            <Text style={styles.sectionTitle}>Select recording language</Text>
            <View style={styles.languageGrid}>
              {LANGUAGE_OPTIONS.map((language) => {
                const selected = language === selectedLanguage;
                return (
                  <Pressable
                    key={language}
                    onPress={() => setSelectedLanguage(language)}
                    style={[styles.languageChip, selected && styles.languageChipActive]}
                  >
                    <Text style={[styles.languageText, selected && styles.languageTextActive]}>{language}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.statusText}>Ready to record in {selectedLanguage}</Text>
            <PrimaryButton label="Start Recording" onPress={startRecording} />
          </View>
        )}

        {step === "recording" && (
          <View style={styles.centerBox}>
            <Text style={[styles.statusText, styles.recordingText]}>Recording in {selectedLanguage}...</Text>
            <PrimaryButton label="Stop & Analyze" variant="secondary" onPress={stopRecordingAndTranscribe} />
          </View>
        )}

        {step === "transcribing" && (
          <View style={styles.centerBox}>
            <Text style={styles.statusText}>Preparing transcript, translation, and category preview...</Text>
          </View>
        )}

        {step === "confirm" && (
          <View style={styles.previewWrap}>
            <Text style={styles.sectionTitle}>Review before filing</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaChip}>Language: {selectedLanguage}</Text>
              <Text style={styles.metaChip}>Category: {predictedCategory}</Text>
              <Text style={styles.metaChip}>Priority: {predictedPriority}</Text>
            </View>

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <Text style={styles.label}>Transcription</Text>
            <Text style={styles.previewBox}>{transcript || "No transcription available yet."}</Text>

            <Text style={styles.label}>English translation</Text>
            <Text style={styles.previewBox}>{translatedText || transcript || "No translation available yet."}</Text>

            <View style={styles.buttonRow}>
              <View style={styles.buttonWrap}>
                <PrimaryButton label="Retry" variant="secondary" onPress={resetPreview} />
              </View>
              <View style={styles.buttonWrap}>
                <PrimaryButton label="Confirm & File" onPress={handleConfirm} disabled={!transcript || !!errorMessage} />
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
    minHeight: 280,
  },
  centerBox: {
    flex: 1,
    justifyContent: "center",
    gap: 16,
  },
  previewWrap: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.ink,
    textAlign: "center",
  },
  statusText: {
    fontSize: 16,
    color: theme.colors.inkMuted,
    textAlign: "center",
  },
  recordingText: {
    color: theme.colors.danger,
  },
  languageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  languageChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  languageChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  languageText: {
    color: theme.colors.primary,
    fontWeight: "600",
  },
  languageTextActive: {
    color: "#fff",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
  errorText: {
    color: theme.colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontSize: 12,
    color: theme.colors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  previewBox: {
    padding: 16,
    backgroundColor: theme.colors.softAlt,
    borderRadius: theme.radius.md,
    color: theme.colors.ink,
    fontSize: 15,
    lineHeight: 22,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  buttonWrap: {
    flex: 1,
  },
});

export default VoiceComplaintScreen;
