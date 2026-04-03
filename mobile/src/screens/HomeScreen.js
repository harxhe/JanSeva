import { View, Text, StyleSheet } from "react-native";
import { theme } from "../utils/theme";
import Card from "../components/Card";
import ActionTile from "../components/ActionTile";
import PrimaryButton from "../components/PrimaryButton";

const HomeScreen = ({ user, onNavigate, latestStatus }) => {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.brand}>JANSEVA</Text>
        <Text style={styles.greeting}>Hello {user.name}</Text>
        <Text style={styles.subtitle}>Choose how you want to submit your civic complaint.</Text>
      </View>

      <Text style={styles.sectionLabel}>Quick actions</Text>
      <View style={styles.tileRow}>
        <ActionTile
          title="Complaint via Text"
          description="Type your issue, review the AI category, then file it."
          tone="primary"
          onPress={() => onNavigate("text")}
        />
        <ActionTile
          title="Complaint via Voice"
          description="Record your complaint and review the transcript before filing."
          tone="accent"
          onPress={() => onNavigate("voice")}
        />
      </View>
      <View style={styles.tileRow}>
        <ActionTile
          title="My Complaints"
          description="Track the complaints that have already been submitted."
          tone="warning"
          onPress={() => onNavigate("history")}
        />
      </View>

      <Card style={styles.statusCard}>
        <Text style={styles.cardTitle}>Latest status</Text>
        <Text style={styles.cardText}>{latestStatus}</Text>
        <PrimaryButton label="View complaint history" onPress={() => onNavigate("history")} />
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  brand: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2.5,
    color: theme.colors.inkMuted,
    marginBottom: 8,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.ink,
  },
  subtitle: {
    color: theme.colors.inkMuted,
    fontSize: 13,
    marginTop: 4,
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
  statusCard: {
    backgroundColor: theme.colors.surface,
  },
});

export default HomeScreen;
