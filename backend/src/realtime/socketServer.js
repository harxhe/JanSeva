const { Server } = require("socket.io");

const eventBus = require("./eventBus");
const { supabaseAdmin } = require("../client/supabase");

const persistVoiceTranscript = async (payload) => {
  const complaintId =
    typeof payload.complaint_id === "string" ? payload.complaint_id.trim() : "";
  const transcriptText =
    typeof payload.transcript_text === "string" ? payload.transcript_text.trim() : "";

  if (!complaintId || !transcriptText) {
    return;
  }

  await supabaseAdmin.from("ai_outputs").insert({
    complaint_id: complaintId,
    model_name:
      typeof payload.model_name === "string" && payload.model_name.trim().length > 0
        ? payload.model_name.trim()
        : "streaming-stt",
  });

  await supabaseAdmin.from("complaint_events").insert({
    complaint_id: complaintId,
    event_type: "voice_transcript_received",
    old_value: null,
    new_value: {
      transcript_text: transcriptText,
      source: "socket",
    },
    actor_type: "system",
    note: "Streaming transcript received via voice socket",
  });
};

const handleVoiceConnection = require("./socketHandler");

const initializeSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const opsNamespace = io.of("/ops");
  const voiceNamespace = io.of("/voice");

  // New Voice Stream Namespace for Real-time Agent
  const streamNamespace = io.of("/voice-stream");
  streamNamespace.on("connection", (socket) => handleVoiceConnection(socket, io));

  opsNamespace.on("connection", (socket) => {
    socket.on("ops:join", (payload = {}) => {
      if (typeof payload.room === "string" && payload.room.trim()) {
        socket.join(payload.room.trim());
      }
    });
  });

  // Legacy/Dashboard Voice Events
  voiceNamespace.on("connection", (socket) => {
    socket.on("voice:join", (payload = {}) => {
      if (typeof payload.session_id === "string" && payload.session_id.trim()) {
        socket.join(payload.session_id.trim());
      }
    });
    // ... keep existing dashboard logic if needed, or deprecate
  });

  eventBus.on("complaint:created", (payload) => {
    opsNamespace.emit("complaint:created", payload);
  });
  // ... other event listeners

  return io;
};

module.exports = {
  initializeSocketServer,
};
