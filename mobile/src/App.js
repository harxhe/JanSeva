import { useMemo, useState, useEffect } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View, Alert } from "react-native";
import { theme } from "./utils/theme";
import HomeScreen from "./screens/HomeScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import TextComplaintScreen from "./screens/TextComplaintScreen";
import VoiceComplaintScreen from "./screens/VoiceComplaintScreen.js";
import HistoryScreen from "./screens/HistoryScreen";
import { apiUrl } from "./config/api";

const DEFAULT_USER = {
  name: "Citizen",
  phone: "",
};

const App = () => {
  const [user] = useState(DEFAULT_USER);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [screen, setScreen] = useState("home");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (user) {
      fetch(apiUrl("/api/complaints"))
        .then(res => res.json())
        .then(data => {
          const list = data.data || [];
          const myIssues = user.phone ? list.filter(c => c.citizens?.phone_number === user.phone) : list;
          const mapped = myIssues.map(c => ({
            id: `C-${c.complaint_number || c.id.slice(0, 4)}`,
            title: c.category || "Issue",
            category: c.category || "General",
            summary: c.raw_text || "Reported via App",
            status: c.status,
            createdAt: new Date(c.created_at).toLocaleDateString()
          }));
          setHistory(mapped);
        })
        .catch(console.error);
    }
  }, [user]);
  const latestStatus = useMemo(() => {
    if (!history.length) {
      return "No complaints yet."
    }
    const latest = history[0];
    return `${latest.title} · ${latest.status}`;
  }, [history]);

  const queueForBackend = async (payload, item) => {
    try {
      const isVoiceSubmission = payload.submissionMode === "voice" && payload.audioUri;
      let res;

      if (isVoiceSubmission) {
        const formData = new FormData();
        const audioPayload = payload.audioUpload || {
          uri: payload.audioUri,
          name: "complaint.m4a",
          type: "audio/mp4",
        };
        if (typeof window !== "undefined" && payload.audioUpload instanceof File) {
          formData.append("audio", audioPayload, audioPayload.name || "complaint.webm");
        } else {
          formData.append("audio", audioPayload);
        }
        formData.append("phone_number", user?.phone || "0000000000");
        formData.append("name", user?.name || "Guest");
        formData.append("language", payload.language || "English");
        formData.append("preferred_language", payload.language || "English");
        formData.append("transcript_text", payload.summary || "");
        formData.append("translated_text", payload.translatedText || payload.summary || "");
        formData.append("category", payload.category || "general");
        formData.append("priority", payload.priority || "medium");

        if (payload.transcriptConfidence != null) {
          formData.append("transcript_confidence", String(payload.transcriptConfidence));
        }
        if (payload.transcriptionModelName) {
          formData.append("transcription_model_name", payload.transcriptionModelName);
        }

        res = await fetch(apiUrl("/api/interactions/voice/submit"), {
          method: "POST",
          body: formData,
        });
      } else {
        const dbPayload = {
          phone_number: user?.phone || "0000000000",
          name: user?.name || "Guest",
          preferred_language: payload.language || "English",
          category: payload.category !== "Pending Classification" ? payload.category : undefined,
          priority: payload.priority,
          message_text: payload.summary,
          translated_text: payload.translatedText,
          channel: "app"
        };

        res = await fetch(apiUrl("/api/interactions/chat"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dbPayload)
        });
      }

      const data = await res.json();
      console.log("Queued for backend:", data);

      if (data.success && data.data) {
         const resolvedCategory = data.data.category || payload.category || "General";
          const historyItem = {
             id: `C-${data.data.complaint_number || data.data.id.slice(0, 4)}`,
            title: resolvedCategory,
            category: resolvedCategory,
            summary: data.data.translated_text || payload.translatedText || payload.summary,
            status: data.data.status || "received",
            createdAt: "Just now"
         };
         setHistory([historyItem, ...history]);
         return data.data;
      }
    } catch (err) {
      console.error(err);
      setHistory([item, ...history]); // optimistic if fails
      throw err;
    }

    return null;
  };

  const handleSubmit = async (payload) => {
    const fallbackCategory = payload.category || "General";
    const item = {
      id: `C-${Date.now().toString().slice(-4)}`,
      title: fallbackCategory,
      category: fallbackCategory,
      summary: payload.summary,
      status: "New",
      createdAt: "Just now",
    };
    try {
      const complaint = await queueForBackend(payload, item);
      const category = complaint?.category || payload.category || "general";
      Alert.alert("Submitted", `Your complaint has been filed under ${category}.`);
      setScreen("history");
      return complaint;
    } catch (error) {
      Alert.alert(
        "Saved locally",
        `We could not reach the complaint backend at ${apiUrl("/api/interactions/chat")}, but your complaint is saved in history.`
      );
      setScreen("history");
      return null;
    }
  };

  const renderScreen = () => {
    switch (screen) {
      case "home":
        return (
          <HomeScreen
            user={user}
            onNavigate={setScreen}
            latestStatus={latestStatus}
          />
        );
      case "text":
        return <TextComplaintScreen onBack={() => setScreen("home")} onSubmit={handleSubmit} />;
      case "voice":
        return <VoiceComplaintScreen onBack={() => setScreen("home")} onSubmit={handleSubmit} />;
      case "history":
        return <HistoryScreen onBack={() => setScreen("home")} history={history} />;
      default:
        return <HomeScreen user={user} onNavigate={setScreen} latestStatus={latestStatus} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {showOnboarding ? (
        <View style={styles.onboardingWrap}>
          <OnboardingScreen onFinish={() => setShowOnboarding(false)} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.screen}>{renderScreen()}</View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    padding: theme.spacing.xl,
  },
  onboardingWrap: {
    flex: 1,
    padding: theme.spacing.xl,
  },
  screen: {
    flex: 1,
    gap: 20,
  },
});

export default App;
