import { View, Text, StyleSheet, Pressable } from "react-native";
import { theme } from "../utils/theme";
import Card from "../components/Card";
import ActionTile from "../components/ActionTile";
import PrimaryButton from "../components/PrimaryButton";

const getInitials = (name) => {
  if (!name) {
    return "SC";
  }
  const parts = name.trim().split(" ");
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
};

const HomeScreen = ({ user, onNavigate, latestStatus }) => {
  const initials = getInitials(user.name);
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Hello {user.name}</Text>
          <Text style={styles.subtitle}>How do you want to report the issue?</Text>
        </View>
        <Pressable
          onPress={() => onNavigate("settings")}
          style={({ pressed }) => [styles.profileCard, pressed && styles.profilePressed]}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileHint}>View profile</Text>
          </View>
        </Pressable>
      </View>
      <Text style={styles.sectionLabel}>Quick actions</Text>
      <View style={styles.tileRow}>
        <ActionTile
          title="Talk to Agent"
          description="Voice call with AI agent and auto-summary."
          tone="accent"
          onPress={() => onNavigate("voice")}
        />
        <ActionTile
          title="Text Complaint"
          description="Send a detailed text with category and photo."
          tone="primary"
          onPress={() => onNavigate("text")}
        />
      </View>
      <View style={styles.tileRow}>
        <ActionTile
          title="Chatbot"
          description="Chat with Samadhan AI for quick help."
          tone="warning"
          onPress={() => onNavigate("chat")}
        />
        <ActionTile
          title="History"
          description="Track and review all your submitted issues."
          onPress={() => onNavigate("history")}
        />
      </View>
      <Card style={styles.statusCard}>
        <Text style={styles.cardTitle}>Latest status</Text>
        <Text style={styles.cardText}>{latestStatus}</Text>
        <PrimaryButton label="View all updates" onPress={() => onNavigate("history")} />
      </Card>
      <Card style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>Notifications</Text>
        <Text style={styles.noticeText}>
          You will receive SMS/FCM updates when your issue changes status.
        </Text>
        <PrimaryButton label="Manage preferences" variant="secondary" onPress={() => onNavigate("settings")} />
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.ink,
  },
  subtitle: {
    color: theme.colors.inkMuted,
    fontSize: 13,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.softAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  profilePressed: {
    opacity: 0.85,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  profileMeta: {
    maxWidth: 120,
  },
  profileName: {
    color: theme.colors.ink,
    fontSize: 12,
    fontWeight: "600",
  },
  profileHint: {
    color: theme.colors.inkMuted,
    fontSize: 11,
  },
  tileRow: {
    flexDirection: "row",
    gap: 12,
  },
  sectionLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.6,
    color: theme.colors.inkMuted,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.ink,
  },
  cardText: {
    color: theme.colors.inkMuted,
    marginVertical: 8,
    fontSize: 13,
  },
  noticeCard: {
    backgroundColor: theme.colors.soft,
  },
  statusCard: {
    backgroundColor: theme.colors.surface,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.ink,
  },
  noticeText: {
    color: theme.colors.inkMuted,
    marginVertical: 8,
    fontSize: 12,
  },
});

export default HomeScreen;
