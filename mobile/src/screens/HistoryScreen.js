import { View, StyleSheet, ScrollView, Text } from "react-native";
import ScreenHeader from "../components/ScreenHeader";
import HistoryItem from "../components/HistoryItem";
import { theme } from "../utils/theme";

const HistoryScreen = ({ onBack, history }) => {
  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Your history"
        subtitle="Track all complaints and their status."
        onBack={onBack}
      />
      <ScrollView contentContainerStyle={styles.list}>
        {history.length ? (
          history.map((item) => <HistoryItem key={item.id} item={item} />)
        ) : (
          <Text style={styles.emptyText}>No complaints submitted yet.</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
    flex: 1,
  },
  list: {
    gap: 12,
    paddingBottom: 20,
  },
  emptyText: {
    color: theme.colors.inkMuted,
    fontSize: 14,
    paddingVertical: 12,
  },
});

export default HistoryScreen;
