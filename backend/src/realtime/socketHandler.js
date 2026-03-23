const fs = require("fs");
const path = require("path");
const aiService = require("../services/aiService");

const sessionBuffers = new Map();

const handleVoiceConnection = (socket, io) => {
  console.log(`Voice client connected: ${socket.id}`);

  socket.on("voice:join", async (payload) => {
    const { session_id, language = "English" } = payload;
    if (sessionBuffers.has(session_id)) {
        // Already joined
        return;
    }
    
    if (session_id) {
      socket.join(session_id);
      sessionBuffers.set(session_id, []);
      console.log(`Socket ${socket.id} joined session ${session_id}`);

      // Trigger Greeting
      try {
          const prompt = `You are a civic portal agent. Greet the user and ask them how you can help with their civic complaint today. Respond only in ${language}.`;
          const greetingResponse = await aiService.chat(prompt, [], language);
          
          socket.emit("voice:response", {
              text: greetingResponse.response,
              audio: greetingResponse.audio_base64,
              is_final: false
          });
      } catch (error) {
          console.error("Greeting failed:", error);
      }
    }
  });

  socket.on("voice:chunk", (payload) => {
    const { session_id, data } = payload;
    if (sessionBuffers.has(session_id) && data) {
      const buffer = Buffer.from(data, "base64");
      sessionBuffers.get(session_id).push(buffer);
    }
  });

  socket.on("voice:commit", async (payload = {}) => {
    const { session_id, language, history } = payload;
    if (!sessionBuffers.has(session_id) || sessionBuffers.get(session_id).length === 0) {
      return;
    }

    const audioBuffer = Buffer.concat(sessionBuffers.get(session_id));
    sessionBuffers.set(session_id, []); // Clear buffer

    // Save to temp file
    const tempFilePath = path.join(__dirname, `../../uploads/${session_id}_${Date.now()}.wav`);
    
    // Ensure uploads dir exists
    const uploadsDir = path.dirname(tempFilePath);
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    try {
        fs.writeFileSync(tempFilePath, audioBuffer);
        
        // 1. Transcribe
        socket.emit("voice:status", { status: "processing_stt" });
        const transcriptResult = await aiService.transcribe(tempFilePath, language);
        const userText = transcriptResult.text;

        // Cleanup temp file with delay to avoid EBUSY
        setTimeout(() => {
            try {
                if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
            } catch (cleanupErr) {
                console.error("Failed to cleanup temp file:", cleanupErr);
            }
        }, 1000);

        if (!userText || userText.trim().length === 0) {
            socket.emit("voice:error", { message: "No speech detected" });
            return;
        }

        // Emit user transcript back
        socket.emit("voice:transcript", { role: "user", content: userText });

        // 2. Chat with AI
        socket.emit("voice:status", { status: "processing_ai" });
        const chatResult = await aiService.chat(userText, history || [], language);
        
        // 3. Send Response
        socket.emit("voice:response", {
            text: chatResult.response,
            audio: chatResult.audio_base64,
            is_final: chatResult.response.includes("[FINISH]")
        });

    } catch (error) {
        console.error("Voice processing error:", error);
        socket.emit("voice:error", { message: "Processing failed" });
        // Cleanup if error
        try {
            if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        } catch (e) {}
    }
  });

  socket.on("disconnect", () => {
    console.log(`Voice client disconnected: ${socket.id}`);
  });
};

module.exports = handleVoiceConnection;
