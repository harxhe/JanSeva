import { View, Text, StyleSheet } from "react-native";
import { theme } from "../utils/theme";

const ChatBubble = ({ role, text }) => {
  const isUser = role === "user";
  return (
    <View style={[styles.bubble, isUser ? styles.user : styles.assistant]}>
      <Text style={[styles.text, isUser && styles.userText]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: "80%",
  },
  user: {
    alignSelf: "flex-end",
    backgroundColor: theme.colors.primary,
  },
  assistant: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.soft,
  },
  text: {
    color: theme.colors.ink,
    fontSize: 13,
  },
  userText: {
    color: "#fff",
  },
});

export default ChatBubble;
