import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform, Modal, ScrollView, TextInput } from "react-native";
import { theme } from "../utils/theme";
import ScreenHeader from "../components/ScreenHeader";
import Card from "../components/Card";
import PrimaryButton from "../components/PrimaryButton";
import { Audio } from "expo-av";
import { apiUrl } from "../config/api";
import { INDIAN_LANGUAGE_OPTIONS, QUICK_LANGUAGE_LABELS } from "../constants/languages";

const isWeb = Platform.OS === "web";

const VoiceComplaintScreen = ({ onBack, onSubmit }) => {
  const [step, setStep] = useState("record");
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [transcript, setTranscript] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [predictedCategory, setPredictedCategory] = useState("pending classification");
  const [predictedPriority, setPredictedPriority] = useState("medium");
  const [recording, setRecording] = useState(null);
  const [audioUri, setAudioUri] = useState("");
  const [audioUpload, setAudioUpload] = useState(null);
  const [transcriptConfidence, setTranscriptConfidence] = useState(null);
  const [transcriptionModelName, setTranscriptionModelName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [languageSearch, setLanguageSearch] = useState("");

  const webRecorderRef = useRef(null);
  const webStreamRef = useRef(null);
  const webChunksRef = useRef([]);

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (webRecorderRef.current && webRecorderRef.current.state !== "inactive") {
        webRecorderRef.current.stop();
      }
      if (webStreamRef.current) {
        webStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [recording]);

  const filteredLanguages = INDIAN_LANGUAGE_OPTIONS.filter((language) => {
    const query = languageSearch.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return (
      language.label.toLowerCase().includes(query) ||
      language.script.toLowerCase().includes(query)
    );
  });

  const resetPreview = () => {
    setTranscript("");
    setTranslatedText("");
    setPredictedCategory("pending classification");
    setPredictedPriority("medium");
    setAudioUri("");
    setAudioUpload(null);
    setTranscriptConfidence(null);
    setTranscriptionModelName("");
    setErrorMessage("");
    setStep("record");
  };

  const startWebRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setErrorMessage("Voice recording is not supported in this browser.");
      setStep("confirm");
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    webChunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        webChunksRef.current.push(event.data);
      }
    };

    webStreamRef.current = stream;
    webRecorderRef.current = recorder;
    recorder.start();
    setStep("recording");
  };

  const startNativeRecording = async () => {
    const permission = await Audio.requestPermissionsAsync();
    if (permission.status !== "granted") {
      throw new Error("Microphone permission was not granted.");
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording: nextRecording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    setRecording(nextRecording);
    setStep("recording");
  };

  const startRecording = async () => {
    try {
      setErrorMessage("");
      if (isWeb) {
        await startWebRecording();
      } else {
        await startNativeRecording();
      }
    } catch (err) {
      console.error("Failed to start recording", err);
      setErrorMessage("Could not start voice recording. Please check microphone access.");
      setStep("confirm");
    }
  };

  const buildWebAudioUpload = async () => {
    const recorder = webRecorderRef.current;

    if (!recorder) {
      throw new Error("Web recorder is not initialized.");
    }

    await new Promise((resolve) => {
      recorder.onstop = resolve;
      recorder.stop();
    });

    if (webStreamRef.current) {
      webStreamRef.current.getTracks().forEach((track) => track.stop());
      webStreamRef.current = null;
    }

    const mimeType = webChunksRef.current[0]?.type || "audio/webm";
    const blob = new Blob(webChunksRef.current, { type: mimeType });
    const extension = mimeType.includes("ogg") ? "ogg" : "webm";
    const file = new File([blob], `complaint.${extension}`, { type: mimeType });

    const objectUrl = URL.createObjectURL(blob);
    setAudioUri(objectUrl);
    setAudioUpload(file);
    webRecorderRef.current = null;

    return file;
  };

  const buildNativeAudioUpload = async () => {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);

    if (!uri) {
      throw new Error("The recording was not saved correctly on the device.");
    }

    const upload = {
      uri,
      name: uri.split("/").pop() || "complaint.m4a",
      type: "audio/mp4",
    };

    setAudioUri(uri);
    setAudioUpload(upload);
    return upload;
  };

  const stopRecordingAndTranscribe = async () => {
    try {
      setStep("transcribing");
      setErrorMessage("");

      const upload = isWeb ? await buildWebAudioUpload() : await buildNativeAudioUpload();

      const formData = new FormData();
      if (isWeb) {
        formData.append("audio", upload, upload.name || "complaint.webm");
      } else {
        formData.append("audio", upload);
      }
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
      setErrorMessage(err.message || `Could not reach ${apiUrl("/api/interactions/voice/transcribe")}. Please try again.`);
      setStep("confirm");
    }
  };

  const handleConfirm = async () => {
    const payload = {
      title: predictedCategory || "voice complaint",
      category: predictedCategory,
      priority: predictedPriority,
      summary: transcript,
      translatedText,
      submissionMode: "voice",
      audioUri,
      audioUpload,
      transcriptConfidence,
      transcriptionModelName,
      language: selectedLanguage,
    };

    await onSubmit(payload);
    resetPreview();
  };

  const selectLanguage = (languageLabel) => {
    setSelectedLanguage(languageLabel);
    setIsLanguageModalVisible(false);
    setLanguageSearch("");
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
            <Text style={styles.selectedLanguageLabel}>Selected: {selectedLanguage}</Text>
            <View style={styles.languageGrid}>
              {QUICK_LANGUAGE_LABELS.map((language) => {
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
              <Pressable onPress={() => setIsLanguageModalVisible(true)} style={styles.moreChip}>
                <Text style={styles.moreChipText}>More languages</Text>
              </Pressable>
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

      <Modal
        visible={isLanguageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLanguageModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsLanguageModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Choose a language</Text>
            <Text style={styles.modalSubtitle}>Quick picks stay on the main screen; everything else lives here.</Text>
            <TextInput
              value={languageSearch}
              onChangeText={setLanguageSearch}
              placeholder="Search language or region"
              placeholderTextColor={theme.colors.inkMuted}
              style={styles.searchInput}
            />
            <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
              {filteredLanguages.map((language) => {
                const selected = selectedLanguage === language.label;
                return (
                  <Pressable
                    key={language.label}
                    style={[styles.languageRow, selected && styles.languageRowActive]}
                    onPress={() => selectLanguage(language.label)}
                  >
                    <View>
                      <Text style={[styles.languageRowTitle, selected && styles.languageRowTitleActive]}>
                        {language.label}
                      </Text>
                      <Text style={styles.languageRowMeta}>{language.script}</Text>
                    </View>
                    {selected ? <Text style={styles.languageRowCheck}>Selected</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
            <PrimaryButton label="Done" variant="secondary" onPress={() => setIsLanguageModalVisible(false)} />
          </Pressable>
        </Pressable>
      </Modal>
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
  selectedLanguageLabel: {
    fontSize: 13,
    color: theme.colors.inkMuted,
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
  moreChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: theme.colors.accent,
    backgroundColor: "#f1fcf8",
  },
  moreChipText: {
    color: theme.colors.accent,
    fontWeight: "700",
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(11, 18, 32, 0.45)",
    padding: theme.spacing.lg,
    justifyContent: "center",
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: 12,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.ink,
  },
  modalSubtitle: {
    fontSize: 13,
    color: theme.colors.inkMuted,
    lineHeight: 18,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.colors.ink,
    backgroundColor: theme.colors.softAlt,
  },
  languageList: {
    maxHeight: 360,
  },
  languageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    marginBottom: 8,
  },
  languageRowActive: {
    backgroundColor: theme.colors.soft,
    borderColor: theme.colors.primary,
  },
  languageRowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.ink,
  },
  languageRowTitleActive: {
    color: theme.colors.primary,
  },
  languageRowMeta: {
    fontSize: 12,
    color: theme.colors.inkMuted,
    marginTop: 2,
  },
  languageRowCheck: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.primary,
  },
});

export default VoiceComplaintScreen;
