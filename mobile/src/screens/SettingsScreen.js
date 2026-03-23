import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../utils/theme";
import ScreenHeader from "../components/ScreenHeader";
import Card from "../components/Card";
import ToggleRow from "../components/ToggleRow";
import PrimaryButton from "../components/PrimaryButton";

const SettingsScreen = ({ onBack }) => {
  const [smsUpdates, setSmsUpdates] = useState(true);
  const [pushUpdates, setPushUpdates] = useState(false);
  const [callBacks, setCallBacks] = useState(true);
  const [locationShare, setLocationShare] = useState(true);
  const [anonMode, setAnonMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  const profile = {
    name: "Aarav Sharma",
    phone: "+91 98765 43210",
    email: "aarav.sharma@example.com",
    location: "Ward 21 · Sector 11",
    language: "Hindi · English",
    memberSince: "Jan 2025",
    verified: true,
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Profile & Preferences"
        subtitle="Manage your citizen profile and notification settings."
        onBack={onBack}
      />
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AS</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{profile.name}</Text>
            <Text style={styles.profileMeta}>{profile.phone}</Text>
            <Text style={styles.profileMeta}>{profile.email}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{profile.verified ? "Verified" : "Pending"}</Text>
          </View>
        </View>
        <View style={styles.profileGrid}>
          <View style={styles.profileItem}>
            <Text style={styles.profileLabel}>Location</Text>
            <Text style={styles.profileValue}>{profile.location}</Text>
          </View>
          <View style={styles.profileItem}>
            <Text style={styles.profileLabel}>Language</Text>
            <Text style={styles.profileValue}>{profile.language}</Text>
          </View>
          <View style={styles.profileItem}>
            <Text style={styles.profileLabel}>Member since</Text>
            <Text style={styles.profileValue}>{profile.memberSince}</Text>
          </View>
        </View>
        <View style={styles.profileActions}>
          <PrimaryButton label="Edit profile" variant="secondary" onPress={() => {}} />
          <PrimaryButton label="Update ID" onPress={() => {}} />
        </View>
      </Card>
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Text style={styles.sectionSubtitle}>How we keep you updated.</Text>
        <ToggleRow
          title="SMS alerts"
          description="Receive SMS updates when status changes."
          value={smsUpdates}
          onValueChange={setSmsUpdates}
        />
        <ToggleRow
          title="FCM push notifications"
          description="Enable mobile push notifications via FCM."
          value={pushUpdates}
          onValueChange={setPushUpdates}
        />
        <ToggleRow
          title="Callback confirmation"
          description="Allow the AI agent to call back for clarifications."
          value={callBacks}
          onValueChange={setCallBacks}
        />
      </Card>
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Other settings</Text>
        <Text style={styles.sectionSubtitle}>Privacy and accessibility controls.</Text>
        <ToggleRow
          title="Share location"
          description="Attach your approximate location to complaints."
          value={locationShare}
          onValueChange={setLocationShare}
        />
        <ToggleRow
          title="Anonymous mode"
          description="Hide your name from public logs and SMS receipts."
          value={anonMode}
          onValueChange={setAnonMode}
        />
        <ToggleRow
          title="High-contrast mode"
          description="Improve readability in bright outdoor light."
          value={highContrast}
          onValueChange={setHighContrast}
        />
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
    flex: 1,
  },
  card: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.ink,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: theme.colors.inkMuted,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.ink,
  },
  profileMeta: {
    fontSize: 12,
    color: theme.colors.inkMuted,
    marginTop: 2,
  },
  badge: {
    backgroundColor: `${theme.colors.accent}22`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.accent,
  },
  profileGrid: {
    gap: 10,
  },
  profileItem: {
    backgroundColor: theme.colors.softAlt,
    padding: 10,
    borderRadius: theme.radius.md,
  },
  profileLabel: {
    fontSize: 11,
    color: theme.colors.inkMuted,
  },
  profileValue: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.ink,
    marginTop: 2,
  },
  profileActions: {
    flexDirection: "row",
    gap: 10,
  },
});

export default SettingsScreen;
