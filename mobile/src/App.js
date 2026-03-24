import { useMemo, useState, useEffect } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View, Alert } from "react-native";
import { theme } from "./utils/theme";
import SignInScreen from "./screens/SignInScreen";
import HomeScreen from "./screens/HomeScreen";
import TextComplaintScreen from "./screens/TextComplaintScreen";
import VoiceComplaintScreen from "./screens/VoiceComplaintScreen";
import HistoryScreen from "./screens/HistoryScreen";
import SettingsScreen from "./screens/SettingsScreen";

const App = () => {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("home");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (user) {
      fetch("http://10.128.169.206:5000/api/complaints")
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
      const dbPayload = {
        phone_number: user?.phone || "0000000000",
        name: user?.name || "Guest",
        category: payload.category !== "Pending Classification" ? payload.category : undefined,
        message_text: payload.summary,
        channel: "app"
      };
      
      const res = await fetch("http://10.128.169.206:5000/api/interactions/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbPayload)
      });
      const data = await res.json();
      console.log("Queued for backend:", data);

      if (data.success && data.data) {
         setHistory([{
            id: `C-${data.data.complaint_number || data.data.id.slice(0, 4)}`,
            title: payload.title,
            category: data.data.category || "General",
            summary: payload.summary,
            status: data.data.status || "New",
            createdAt: "Just now"
         }, ...history]);
      }
    } catch (err) {
      console.error(err);
      setHistory([item, ...history]); // optimistic if fails
    }
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
    queueForBackend(payload, item);
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
        return <VoiceComplaintScreen onBack={() => setScreen("home")} onSubmit={handleSubmit} />;
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
