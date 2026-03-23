import { useState } from "react";
import { View, TextInput, StyleSheet, ScrollView } from "react-native";
import { theme } from "../utils/theme";
import ScreenHeader from "../components/ScreenHeader";
import Card from "../components/Card";
import PrimaryButton from "../components/PrimaryButton";
import ChatBubble from "../components/ChatBubble";
import { mockChat } from "../data/mockData";

const ChatBotScreen = ({ onBack }) => {
  const [messages, setMessages] = useState(mockChat);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) {
      return;
    }
    const newMessages = [
      ...messages,
      { id: `u-${Date.now()}`, role: "user", text: input.trim() },
      {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: "Thanks. I have noted this issue and can help you file a complaint.",
      },
    ];
    setMessages(newMessages);
    setInput("");
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Samadhan Chatbot"
        subtitle="Ask questions or file a complaint via chat."
        onBack={onBack}
      />
      <Card style={styles.chatCard}>
        <ScrollView contentContainerStyle={styles.chatList}>
          {messages.map((msg) => (
            <ChatBubble key={msg.id} role={msg.role} text={msg.text} />
          ))}
        </ScrollView>
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type your message"
            placeholderTextColor={theme.colors.inkMuted}
            style={styles.input}
          />
          <PrimaryButton label="Send" onPress={handleSend} />
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
    flex: 1,
  },
  chatCard: {
    flex: 1,
    gap: 12,
  },
  chatList: {
    gap: 10,
    paddingBottom: 10,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 10,
    color: theme.colors.ink,
  },
});

export default ChatBotScreen;
