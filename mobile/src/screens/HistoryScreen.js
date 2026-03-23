import { View, StyleSheet, ScrollView } from "react-native";
import ScreenHeader from "../components/ScreenHeader";
import HistoryItem from "../components/HistoryItem";

const HistoryScreen = ({ onBack, history }) => {
  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Your history"
        subtitle="Track all complaints and their status."
        onBack={onBack}
      />
      <ScrollView contentContainerStyle={styles.list}>
        {history.map((item) => (
          <HistoryItem key={item.id} item={item} />
        ))}
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
});

export default HistoryScreen;
