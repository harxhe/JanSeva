import { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Alert, ScrollView, Pressable, Animated } from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { theme } from "../utils/theme";
import ScreenHeader from "../components/ScreenHeader";
import Card from "../components/Card";
import PrimaryButton from "../components/PrimaryButton";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import io from "socket.io-client";

const API_URL = "http://192.168.137.1:5000"; // Base URL for socket
const SOCKET_URL = `${API_URL}/voice-stream`;

// Comfort noise or silence threshold
const VAD_THRESHOLD = -25; // dB (Significantly increased to prevent background noise)
const SILENCE_DURATION = 1200; // ms

const LANGUAGES = [
    { name: "English", code: "en" },
    { name: "Hindi", code: "hi" },
    { name: "Bengali", code: "bn" },
    { name: "Punjabi", code: "pa" },
    { name: "Tamil", code: "ta" },
    { name: "Telugu", code: "te" },
    { name: "Marathi", code: "mr" },
    { name: "Gujarati", code: "gu" },
    { name: "Kannada", code: "kn" },
    { name: "Malayalam", code: "ml" }
];

// ... (PulseOrb code remains the same)

// ... inside VoiceAgentScreen ...
// ...

const PulseOrb = ({ mode }) => {

    // modes: "listening", "processing", "speaking", "idle"
    const scale = useRef(new Animated.Value(1)).current;
    const opacity = useRef(new Animated.Value(0.6)).current;

    useEffect(() => {
        let animation;
        if (mode !== "idle") {
            const duration = mode === "processing" ? 600 : 1200;
            const maxScale = mode === "speaking" ? 1.5 : mode === "processing" ? 1.2 : 1.3;
            
            animation = Animated.loop(
                Animated.parallel([
                    Animated.sequence([
                        Animated.timing(scale, {
                            toValue: maxScale,
                            duration: duration,
                            useNativeDriver: true,
                        }),
                        Animated.timing(scale, {
                            toValue: 1,
                            duration: duration,
                            useNativeDriver: true,
                        }),
                    ]),
                    Animated.sequence([
                        Animated.timing(opacity, {
                            toValue: 1,
                            duration: duration,
                            useNativeDriver: true,
                        }),
                        Animated.timing(opacity, {
                            toValue: 0.6,
                            duration: duration,
                            useNativeDriver: true,
                        }),
                    ]),
                ])
            );
            animation.start();
        } else {
            scale.setValue(1);
            opacity.setValue(0.6);
        }
        return () => animation?.stop();
    }, [mode]);

    const getColor = () => {
        switch(mode) {
            case "listening": return theme.colors.primary;
            case "processing": return theme.colors.accent;
            case "speaking": return "#10b981"; // Green
            default: return theme.colors.primary;
        }
    };

    return (
        <View style={styles.orbContainer}>
            <Animated.View 
                style={[
                    styles.orb, 
                    { 
                        transform: [{ scale }], 
                        opacity,
                        backgroundColor: getColor()
                    }
                ]} 
            />
            <View style={styles.orbInner} />
        </View>
    );
};

const VoiceAgentScreen = ({ onBack, onSubmit }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [interactionMode, setInteractionMode] = useState(null); // 'live' or 'note'
  const [sessionId, setSessionId] = useState(null);
  const [history, setHistory] = useState([]);
  const [displayedText, setDisplayedText] = useState("Connecting...");
  const [callStatus, setCallStatus] = useState("disconnected"); 
  const [mode, setMode] = useState("idle"); 
  const [summaryData, setSummaryData] = useState(null);

  const socketRef = useRef(null);
  const recordingRef = useRef(null);
  const soundRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const speechDetectedRef = useRef(false);
  const chunksRef = useRef([]);

  useEffect(() => {
    return () => {
      cleanupSession();
    };
  }, []);

  const cleanupSession = async () => {
      if (recordingRef.current) {
          await recordingRef.current.stopAndUnloadAsync();
      }
      if (soundRef.current) {
          await soundRef.current.unloadAsync();
      }
      if (socketRef.current) {
          socketRef.current.disconnect();
      }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  };

  const connectSocket = (lang) => {
      const socket = io(SOCKET_URL);
      socketRef.current = socket;

      socket.on("connect", () => {
          console.log("Socket connected");
          const sid = `sess_${Date.now()}`;
          setSessionId(sid);
          
          socket.emit("voice:join", { 
              session_id: sid,
              language: lang.name 
          });
          
          setCallStatus("active");
          setMode("processing");
          setDisplayedText("Agent is joining...");
      });

      socket.on("voice:response", async (data) => {
          setMode("speaking");
          
          // Enable mic IMMEDIATELY for interruption (Barge-in)
          startListening();

          if (data.text) {
              setDisplayedText(data.text);
              setHistory(prev => [...prev, { role: "assistant", content: data.text }]);
          }
          if (data.audio) {
              await playAudio(data.audio);
          }
          
          if (data.is_final) {
               setTimeout(() => endSession(true), 1500);
          } else {
              // Ensure we are still listening
              if (!recordingRef.current) startListening();
          }
      });

      socket.on("voice:transcript", (data) => {
          setDisplayedText(data.content);
          setHistory(prev => [...prev, data]);
      });
      
      socket.on("voice:status", (data) => {
           if (data.status === 'processing_stt' || data.status === 'processing_ai') {
               setMode("processing");
           }
      });

      socket.on("voice:error", (data) => {
          console.log("Voice error:", data);
          setMode("listening"); 
          startListening();
      });
  };

  // ... inside VoiceAgentScreen ...
  const selectedLanguageRef = useRef(null); // Ref to access current language in callbacks/timeouts



  // ...

  const onRecordingStatusUpdate = async (status) => {
      if (!status.isRecording) return;
      
      const metering = status.metering || -100;
      
      // ONLY use VAD if in 'live' interaction mode
      if (interactionMode === 'live') {
          if (metering > VAD_THRESHOLD) {
              // INTERRUPT LOGIC
              if (mode === "speaking" && soundRef.current) {
                  console.log("Interrupting AI...");
                  try {
                      await soundRef.current.stopAsync();
                      await soundRef.current.unloadAsync();
                      soundRef.current = null;
                  } catch (e) { console.log(e); }
                  setMode("listening");
                  setDisplayedText("Listening (Interrupted)...");
              }

              speechDetectedRef.current = true;
              if (silenceTimerRef.current) {
                  clearTimeout(silenceTimerRef.current);
                  silenceTimerRef.current = null;
              }
          } else if (speechDetectedRef.current) {
              if (!silenceTimerRef.current) {
                  silenceTimerRef.current = setTimeout(() => {
                      commitAudio();
                  }, SILENCE_DURATION);
              }
          }
      }
  };

  const startListening = async () => {
      // Allow 'speaking' mode now for barge-in
      if (mode === "processing") return;
      setMode("listening");
      setDisplayedText("Listening...");
      
      try {
          if (recordingRef.current) {
              try {
                  await recordingRef.current.stopAndUnloadAsync();
              } catch (e) { /* ignore already unloaded */ }
              recordingRef.current = null;
          }

          const permission = await Audio.requestPermissionsAsync();
          if (permission.status !== "granted") return;

          await Audio.setAudioModeAsync({
              allowsRecordingIOS: true,
              playsInSilentModeIOS: true,
              staysActiveInBackground: true,
          });

          const { recording } = await Audio.Recording.createAsync(
              Audio.RecordingOptionsPresets.HIGH_QUALITY,
              onRecordingStatusUpdate
          );
          recordingRef.current = recording;
          
      } catch (err) {
          console.error("Failed to start recording", err);
      }
  };

  const commitAudio = async () => {
      if (!recordingRef.current) return;
      
      // Prevent double commit
      const recording = recordingRef.current;
      recordingRef.current = null; // Clear immediately to prevent race

      console.log("Committing audio...");
      setMode("processing");
      speechDetectedRef.current = false;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

      try {
          try {
              await recording.stopAndUnloadAsync();
          } catch(e) { /* ignore */ }
          
          const uri = recording.getURI();
          const base64 = await FileSystem.readAsStringAsync(uri, {
              encoding: FileSystem.EncodingType.Base64,
          });

          socketRef.current.emit("voice:chunk", {
              session_id: sessionId,
              data: base64
          });

          // Use ref to get language safely
          const langName = selectedLanguageRef.current?.name || "English";
          
          socketRef.current.emit("voice:commit", {
              session_id: sessionId,
              language: langName,
              history: history
          });

      } catch (e) {
          console.error("Commit failed", e);
          startListening(); 
      }
  };

  // ...
  const sendVoiceNote = async (uri) => {
      setMode("processing");
      setDisplayedText("Sending voice note...");
      
      try {
          const formData = new FormData();
          formData.append('audio', {
              uri: uri,
              type: 'audio/m4a',
              name: 'voice_note.m4a',
          });
          formData.append('language', selectedLanguageRef.current?.name || "English");
          formData.append('session_id', sessionId || `sess_${Date.now()}`);
          formData.append('history', JSON.stringify(history));

          const response = await fetch(`${API_URL}/api/interactions/voice`, {
              method: 'POST',
              body: formData,
              headers: {
                  'Content-Type': 'multipart/form-data',
              },
          });

          const data = await response.json();
          
          if (data.success) {
              setSessionId(data.session_id);
              
              // Update History
              const newHistory = [...history];
              if (data.transcript) {
                   newHistory.push({ role: "user", content: data.transcript });
                   setDisplayedText(data.transcript); 
              }
              if (data.response_text) {
                   newHistory.push({ role: "assistant", content: data.response_text });
                   setDisplayedText(data.response_text);
              }
              setHistory(newHistory);

              // Play Response
              if (data.audio_base64) {
                  setMode("speaking");
                  await playAudio(data.audio_base64);
                  setMode("idle");
              } else {
                  setMode("idle");
              }

              // Check for termination logic if needed, though REST usually simpler
          } 
      } catch (e) {
          console.error("Voice Note Error", e);
          setDisplayedText("Error sending voice note.");
          setMode("idle");
      }
  };

  const startRecordingNote = async () => {
      // 1. Interrupt AI if speaking
      if (soundRef.current) {
          try {
              await soundRef.current.stopAsync();
              await soundRef.current.unloadAsync();
              soundRef.current = null;
          } catch (e) { }
      }

      // 2. Clear existing recording if any (Fixes "Only one Recording" error)
      if (recordingRef.current) {
          try {
              await recordingRef.current.stopAndUnloadAsync();
          } catch (e) { }
          recordingRef.current = null;
      }

      try {
          await Audio.setAudioModeAsync({
              allowsRecordingIOS: true,
              playsInSilentModeIOS: true,
              staysActiveInBackground: true,
          });
          const { recording } = await Audio.Recording.createAsync(
              Audio.RecordingOptionsPresets.HIGH_QUALITY
          );
          recordingRef.current = recording;
          setMode("listening");
      } catch (e) { console.error(e); }
  };

  const stopRecordingNote = async () => {
      if (!recordingRef.current) return;
      setMode("processing");
      try {
          await recordingRef.current.stopAndUnloadAsync();
          const uri = recordingRef.current.getURI();
          recordingRef.current = null;
          await sendVoiceNote(uri);
      } catch (e) { console.error(e); }
  };

  const playAudio = async (base64) => {
      try {
          if (soundRef.current) {
              await soundRef.current.unloadAsync();
          }
          const uri = FileSystem.cacheDirectory + 'response.mp3';
          await FileSystem.writeAsStringAsync(uri, base64, {
              encoding: FileSystem.EncodingType.Base64,
          });
          const { sound } = await Audio.Sound.createAsync(
              { uri },
              { shouldPlay: true }
          );
          soundRef.current = sound;
          await sound.playAsync();
          
          return new Promise((resolve) => {
              sound.setOnPlaybackStatusUpdate((status) => {
                  if (status.didJustFinish) {
                      resolve();
                  }
              });
          });
      } catch (e) {
          console.error("Play error", e);
      }
  };

  const startSession = (lang) => {
      setSelectedLanguage(lang);
      selectedLanguageRef.current = lang; 
      // Don't connect yet, let UI show mode selection
  };

  const confirmMode = async (selectedMode) => {
      setInteractionMode(selectedMode);
      if (selectedMode === 'live') {
          setCallStatus("connecting");
          connectSocket(selectedLanguage);
      } else {
          setCallStatus("active");
          setMode("processing");
          setDisplayedText("Agent is joining...");
          
          try {
              const response = await fetch(`${API_URL}/api/interactions/voice/start`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ language: selectedLanguage.name })
              });
              const data = await response.json();
              if (data.sessionId) setSessionId(data.sessionId); // Handle case sensitivity
              if (data.session_id) setSessionId(data.session_id);

              if (data.message) {
                  setHistory([{ role: 'assistant', content: data.message }]);
                  setDisplayedText(data.message);
              }
              if (data.audio_base64) {
                  setMode("speaking");
                  await playAudio(data.audio_base64);
              }
              setMode("idle");
          } catch (e) {
              console.error("Failed to start voice session", e);
              setMode("idle");
          }
      }
  };

  const endSession = async (auto = false) => {
      setMode("idle");
      cleanupSession();
      
      if (history.length > 0) {
           const transcript = history.map(h => h.content).join("\n");
           setSummaryData({
               category: "General (Auto)",
               raw_text: transcript,
           });

           try {
               const response = await fetch(`${API_URL}/api/interactions/voice/end`, {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ 
                       session_id: sessionId,
                       history: history 
                   }) 
               });
               const data = await response.json();
                if (data.success) {
                   setSummaryData(prev => ({ ...prev, ...data.data }));
               } else {
                   console.error("End session API failed:", data);
                   Alert.alert("Error", "Failed to save complaint to database.");
               }
           } catch(e) {
               console.error("Network error ending session:", e);
               Alert.alert("Connection Error", "Could not reach server to save complaint.");
           }

           setCallStatus("summary");
      } else {
          onBack();
      }
  };

  const handleFinalSubmit = () => {
      if (onSubmit) {
          onSubmit({
              title: summaryData?.category || "Voice Complaint",
              category: summaryData?.category || "General",
              summary: summaryData?.raw_text || "No details available.",
          });
      }
      // Alert.alert("Success", "Complaint filed successfully!"); // App.js handles alert
      // onBack(); // App.js handles navigation
  };

  if (callStatus === "disconnected") {
      if (!selectedLanguage) {
          return (
              <View style={styles.container}>
                  <ScreenHeader title="Voice Agent" onBack={onBack} />
                  <View style={styles.langOverlay}>
                      <Text style={styles.langTitle}>Select your language</Text>
                      <ScrollView contentContainerStyle={styles.langGrid}>
                          {LANGUAGES.map((lang) => (
                              <Pressable 
                                key={lang.code} 
                                onPress={() => startSession(lang)}
                                style={styles.langItem}
                              >
                                  <View style={styles.langCircle}>
                                      <Text style={styles.langInitial}>{lang.name[0]}</Text>
                                  </View>
                                  <Text style={styles.langName}>{lang.name}</Text>
                              </Pressable>
                          ))}
                      </ScrollView>
                  </View>
              </View>
          );
      } else {
          // Mode Selection
          return (
               <View style={styles.container}>
                  <ScreenHeader title="Choose Mode" onBack={() => setSelectedLanguage(null)} />
                  <View style={styles.modeContainer}>
                      <Text style={styles.modeTitle}>How would you like to talk?</Text>
                      
                      <Pressable style={styles.modeOption} onPress={() => confirmMode('note')}>
                          <View style={[styles.modeIcon, { backgroundColor: theme.colors.primary }]}>
                              <MaterialCommunityIcons name="microphone" size={32} color="#fff" />
                          </View>
                      <View style={styles.modeTextContainer}>
                              <Text style={styles.modeName}>Voice Note</Text>
                              <Text style={styles.modeDesc}>Hold to speak, release to send.</Text>
                          </View>
                      </Pressable>

                      <Pressable style={styles.modeOption} onPress={() => confirmMode('live')}>
                          <View style={[styles.modeIcon, { backgroundColor: theme.colors.accent }]}>
                              <MaterialCommunityIcons name="phone" size={32} color="#fff" />
                          </View>
                      <View style={styles.modeTextContainer}>
                              <Text style={styles.modeName}>Live Call</Text>
                              <Text style={styles.modeDesc}>Hands-free, real-time conversation.</Text>
                          </View>
                      </Pressable>
                  </View>
               </View>
          );
      }
  }

  if (callStatus === "connecting") {
      return (
          <View style={[styles.fullscreen, { justifyContent: 'center', alignItems: 'center' }]}>
              <ScreenHeader title="Voice Agent" onBack={() => setCallStatus("disconnected")} />
              <PulseOrb mode="processing" />
              <Text style={styles.captionText}>Connecting...</Text>
          </View>
      );
  }

  if (callStatus === "summary") {
      return (
          <View style={styles.container}>
              <ScreenHeader title="Call Summary" onBack={() => setCallStatus("active")} />
              <ScrollView style={styles.summaryScroll}>
                  <Card style={styles.summaryCard}>
                      <Text style={styles.summaryTitle}>Complaint Details</Text>
                      <View style={styles.summaryItem}>
                          <Text style={styles.summaryLabel}>Category</Text>
                          <Text style={styles.summaryValue}>{summaryData?.category || "Processing..."}</Text>
                      </View>
                      <View style={styles.summaryItem}>
                          <Text style={styles.summaryLabel}>Full Transcript</Text>
                          <Text style={styles.summaryText}>{summaryData?.raw_text || "No transcript available."}</Text>
                      </View>
                  </Card>
              </ScrollView>
              <View style={styles.summaryFooter}>
                  <PrimaryButton 
                      label="Confirm & File" 
                      onPress={handleFinalSubmit} 
                  />
                  <PrimaryButton 
                      label="Restart Call" 
                      onPress={() => {
                           setCallStatus("disconnected");
                           setHistory([]);
                      }} 
                      variant="secondary"
                  />
              </View>
          </View>
      );
  }

  const renderVoiceNoteInterface = () => (
      <View style={styles.noteContainer}>
          <ScrollView>
              <Card style={styles.statusCard}>
                  <Text style={styles.cardLabel}>Status</Text>
                  <View style={styles.statusRow}>
                      <Pressable 
                          style={[
                              styles.recordToggle, 
                              mode === "listening" ? styles.recordToggleActive : styles.recordToggleInactive
                          ]}
                          onPress={() => {
                              if (mode === "listening") stopRecordingNote();
                              else startRecordingNote();
                          }}
                      >
                          <Text style={styles.recordToggleText}>
                              {mode === "listening" ? "Stop Talking" : "Start Talking"}
                          </Text>
                      </Pressable>
                      <Text style={styles.statusText}>
                          {mode === "listening" ? "Listening..." : "Ready"}
                      </Text>
                  </View>
              </Card>

              <Card style={styles.transcriptCard}>
                  <Text style={styles.cardLabel}>Transcript</Text>
                  <Text style={styles.transcriptText}>
                      {history.filter(h => h.role === 'user').slice(-1)[0]?.content || "Your speech will appear here."}
                  </Text>
              </Card>

              <Card style={styles.responseCard}>
                  <Text style={styles.cardLabel}>AI Agent Response</Text>
                  <Text style={styles.responseText}>
                      {history.filter(h => h.role === 'assistant').slice(-1)[0]?.content || "Agent response will appear here..."}
                  </Text>
              </Card>
          </ScrollView>

          <View style={styles.noteFooter}>
              <PrimaryButton 
                  label="File as Complaint" 
                  onPress={() => endSession()} 
              />
          </View>
      </View>
  );

  return (
    <View style={styles.fullscreen}>
      <View style={styles.header}>
          <Pressable onPress={async () => {
              await cleanupSession();
              onBack();
          }} style={styles.backButton}>
             <MaterialCommunityIcons name="close" size={32} color={theme.colors.ink} />
          </Pressable>
          <Text style={styles.headerTitle}>
              {selectedLanguage?.name} {interactionMode === 'live' ? 'Call' : 'Note'}
          </Text>
          <View style={styles.headerPlaceholder} />
      </View>

      {interactionMode === 'live' ? (
          <>
             <View style={styles.main}>
                  <PulseOrb mode={mode} />
                  <View style={styles.captionContainer}>
                      <Text style={styles.captionText}>{displayedText}</Text>
                      <Text style={styles.statusSubtext}>{mode.toUpperCase()}</Text>
                  </View>
              </View>
              <View style={styles.footer}>
                  <Text style={styles.hintText}>Speak naturally. I'm listening.</Text>
                  <Pressable 
                    style={styles.hangUpButton} 
                    onPress={() => endSession()}
                  >
                     <MaterialCommunityIcons name="phone-hangup" size={32} color="#fff" />
                  </Pressable>
              </View>
          </>
      ) : (
          renderVoiceNoteInterface()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // ... existing styles ...
  noteContainer: { flex: 1, padding: 16 },
  statusCard: { marginBottom: 16, padding: 20, backgroundColor: '#fff', borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  transcriptCard: { marginBottom: 16, minHeight: 120, padding: 20, backgroundColor: '#fff', borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  responseCard: { marginBottom: 16, minHeight: 120, padding: 20, backgroundColor: '#fff', borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  
  cardLabel: { fontSize: 13, color: theme.colors.inkMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusText: { color: theme.colors.primary, fontWeight: '600' },
  
  recordToggle: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 24,
      minWidth: 140,
      alignItems: 'center',
  },
  recordToggleInactive: { backgroundColor: theme.colors.primary },
  recordToggleActive: { backgroundColor: '#ef4444' }, // Red
  recordToggleText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  transcriptText: { color: theme.colors.ink, fontSize: 16, lineHeight: 24 },
  responseText: { color: theme.colors.ink, fontSize: 16, lineHeight: 24, fontStyle: 'italic' },
  
  noteFooter: { paddingVertical: 20 },
  
  // ... rest of styles ...
  container: { flex: 1, gap: 16 },
  fullscreen: { flex: 1, backgroundColor: '#F5F7FB' }, // Light Theme
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 20 },
  headerTitle: { color: theme.colors.ink, fontSize: 18, fontWeight: '700' },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 22 },
  headerPlaceholder: { width: 44 },
  main: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  orbContainer: { width: 200, height: 200, justifyContent: 'center', alignItems: 'center', marginBottom: 60 },
  orb: { width: 140, height: 140, borderRadius: 70, position: 'absolute', shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10, zIndex: 1 },
  orbInner: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.8)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  captionContainer: { minHeight: 120, justifyContent: 'center', alignItems: 'center', zIndex: 10, marginTop: 40 },
  captionText: { color: theme.colors.ink, fontSize: 24, fontWeight: '500', textAlign: 'center', lineHeight: 32 },
  statusSubtext: { color: theme.colors.inkMuted, fontSize: 12, marginTop: 10, letterSpacing: 1.5 },
  footer: { paddingBottom: 50, alignItems: 'center', gap: 20 },
  hangUpButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: '#ef4444', // Red
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#ef4444',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
  },
  modeContainer: { flex: 1, padding: 20, justifyContent: 'center', gap: 20 },
  modeTitle: { fontSize: 24, fontWeight: '700', color: theme.colors.ink, textAlign: 'center', marginBottom: 40 },
  modeOption: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      padding: 20, 
      backgroundColor: theme.colors.surface, 
      borderRadius: 16, 
      marginBottom: 16, 
      gap: 16, 
      shadowColor: '#000', 
      shadowOpacity: 0.05, 
      shadowRadius: 10, 
      elevation: 2 
  },
  modeTextContainer: { flex: 1 },
  modeName: { fontSize: 18, fontWeight: '700', color: theme.colors.ink, marginBottom: 4 },
  modeDesc: { fontSize: 14, color: theme.colors.inkMuted, flexWrap: 'wrap' },
  
  hintText: { color: theme.colors.inkMuted, fontSize: 14 },
  langOverlay: { flex: 1, padding: 20, backgroundColor: theme.colors.surface, borderRadius: theme.radius.xl, marginTop: 20 },
  langTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.ink, marginBottom: 20, textAlign: 'center' },
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  langItem: { width: '45%', aspectRatio: 1, backgroundColor: theme.colors.soft, borderRadius: theme.radius.lg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  langCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  langInitial: { color: '#fff', fontSize: 20, fontWeight: '700' },
  langName: { fontSize: 14, color: theme.colors.ink, fontWeight: '600' },
  summaryScroll: { flex: 1, padding: 16 },
  summaryCard: { padding: 20, gap: 16 },
  summaryTitle: { fontSize: 22, fontWeight: '800', color: theme.colors.primary, marginBottom: 10 },
  summaryItem: { gap: 4 },
  summaryLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.inkMuted, textTransform: 'uppercase' },
  summaryValue: { fontSize: 18, fontWeight: '600', color: theme.colors.ink },
  summaryText: { fontSize: 15, lineHeight: 22, color: theme.colors.ink, backgroundColor: theme.colors.soft, padding: 12, borderRadius: 12, marginTop: 8 },
  summaryFooter: { padding: 20, gap: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: theme.colors.border }
});

export default VoiceAgentScreen;
