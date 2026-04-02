import { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../utils/theme";
import ScreenHeader from "../components/ScreenHeader";
import Card from "../components/Card";
import PrimaryButton from "../components/PrimaryButton";
import { Audio } from "expo-av";

const VoiceComplaintScreen = ({ onBack, onSubmit }) => {
  const [step, setStep] = useState("record"); // record, recording, transcribing, confirm
  const [transcript, setTranscript] = useState("");
  const [recording, setRecording] = useState(null);
  const [audioUri, setAudioUri] = useState("");
  const [transcriptConfidence, setTranscriptConfidence] = useState(null);
  const [transcriptionModelName, setTranscriptionModelName] = useState("");

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [recording]);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === "granted") {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(recording);
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

      const formData = new FormData();
      formData.append("audio", {
        uri,
        name: "complaint.m4a",
        type: "audio/m4a",
      });
      formData.append("language", "English");

      const res = await fetch("http://10.128.169.206:5000/api/interactions/voice/transcribe", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setTranscript(data.transcript);
        setTranscriptConfidence(data.confidence ?? null);
        setTranscriptionModelName(data.model_name || "");
      } else {
        setTranscript("Transcription failed. Please try typing instead.");
        setTranscriptConfidence(null);
        setTranscriptionModelName("");
      }
      setStep("confirm");
    } catch (err) {
      console.error(err);
      setTranscript("Error transcribing audio.");
      setTranscriptConfidence(null);
      setTranscriptionModelName("");
      setStep("confirm");
    }
  };

  const handleConfirm = () => {
    const payload = {
      title: "Voice issue reported",
      category: "Pending Classification",
      summary: transcript,
      submissionMode: "voice",
      audioUri,
      transcriptConfidence,
      transcriptionModelName,
    };
    onSubmit(payload);
  };

  const handleReject = () => {
    setTranscript("");
    setAudioUri("");
    setTranscriptConfidence(null);
    setTranscriptionModelName("");
    setStep("record");
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Voice Complaint"
        subtitle="Record your issue and we'll transcribe it."
        onBack={onBack}
      />
      <Card style={styles.card}>
        {step === "record" && (
          <View style={styles.centerBox}>
            <Text style={styles.statusText}>Ready to record</Text>
            <PrimaryButton label="Start Recording" onPress={startRecording} />
          </View>
        )}

        {step === "recording" && (
          <View style={styles.centerBox}>
            <Text style={[styles.statusText, {color: "red"}]}>Recording...</Text>
            <PrimaryButton label="Stop & Transcribe" variant="secondary" onPress={stopRecordingAndTranscribe} />
          </View>
        )}

        {step === "transcribing" && (
          <View style={styles.centerBox}>
            <Text style={styles.statusText}>Transcribing your audio...</Text>
          </View>
        )}

        {step === "confirm" && (
          <View style={styles.centerBox}>
            <Text style={styles.sectionTitle}>Did we get that right?</Text>
            <Text style={styles.transcriptBox}>{transcript}</Text>
            <View style={styles.buttonRow}>
              <View style={{ flex: 1 }}>
                <PrimaryButton label="Retype/Retry" variant="secondary" onPress={handleReject} />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton label="Submit" onPress={handleConfirm} />
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
    minHeight: 200,
  },
  centerBox: {
    flex: 1,
    justifyContent: "center",
    gap: 16,
  },
  statusText: {
    fontSize: 16,
    color: theme.colors.inkMuted,
    textAlign: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.ink,
    textAlign: "center",
  },
  transcriptBox: {
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
});

export default VoiceComplaintScreen;
