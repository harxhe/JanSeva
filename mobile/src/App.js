import { useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View, Alert } from "react-native";
import { theme } from "./utils/theme";
import { mockHistory } from "./data/mockData";
import SignInScreen from "./screens/SignInScreen";
import HomeScreen from "./screens/HomeScreen";
import TextComplaintScreen from "./screens/TextComplaintScreen";
import VoiceAgentScreen from "./screens/VoiceAgentScreen";
import ChatBotScreen from "./screens/ChatBotScreen";
import HistoryScreen from "./screens/HistoryScreen";
import SettingsScreen from "./screens/SettingsScreen";

const App = () => {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("home");
  const [history, setHistory] = useState(mockHistory);

  const latestStatus = useMemo(() => {
    if (!history.length) {
      return "No complaints yet."
    }
    const latest = history[0];
    return `${latest.title} · ${latest.status}`;
  }, [history]);

  const queueForBackend = (payload) => {
    console.log("Queued for backend:", payload);
  };

  const handleSubmit = (payload) => {
    const item = {
      id: `C-${Date.now().toString().slice(-4)}`,
      title: payload.title,
      category: payload.category,
      summary: payload.summary,
      status: "New",
      createdAt: "Just now",
    };
    queueForBackend(item);
    setHistory([item, ...history]);
    Alert.alert("Submitted", "Your issue was captured and queued.");
    setScreen("history");
  };

  if (!user) {
    return <SignInScreen onSuccess={(profile) => { setUser(profile); setScreen("home"); }} />;
  }

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
        return <VoiceAgentScreen onBack={() => setScreen("home")} onSubmit={handleSubmit} />;
      case "chat":
        return <ChatBotScreen onBack={() => setScreen("home")} />;
      case "history":
        return <HistoryScreen onBack={() => setScreen("home")} history={history} />;
      case "settings":
        return <SettingsScreen onBack={() => setScreen("home")} />;
      default:
        return <HomeScreen user={user} onNavigate={setScreen} latestStatus={latestStatus} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.screen}>{renderScreen()}</View>
      </ScrollView>
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
  screen: {
    flex: 1,
    gap: 20,
  },
});

export default App;
