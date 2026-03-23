import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../utils/theme";
import ScreenHeader from "../components/ScreenHeader";
import Card from "../components/Card";
import PrimaryButton from "../components/PrimaryButton";

const VoiceComplaintScreen = ({ onBack, onSubmit }) => {
  const [step, setStep] = useState("record"); // record, transcribing, confirm
  const [transcript, setTranscript] = useState("");

  const handleRecordSimulate = () => {
    setStep("transcribing");
    // Simulate transcribing delay
    setTimeout(() => {
      setTranscript("There is a large pothole near the station disrupting traffic.");
      setStep("confirm");
    }, 1500);
  };

  const handleConfirm = () => {
    const payload = {
      title: "Voice issue reported",
      category: "Pending Classification",
      summary: transcript,
    };
    onSubmit(payload);
  };

  const handleReject = () => {
    setTranscript("");
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
            <PrimaryButton label="Start Recording" onPress={handleRecordSimulate} />
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
