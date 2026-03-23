const { createComplaintRecord, createHttpError, isNonEmptyString } = require("./complaintController");
const eventBus = require("../realtime/eventBus");

const createChatInteraction = async (req, res, next) => {
  try {
    const body = req.body || {};

    const complaint = await createComplaintRecord(
      {
        phone_number: body.phone_number,
        name: body.name,
        preferred_language: body.preferred_language,
        channel: body.channel || "whatsapp",
        raw_text: body.message_text,
        category: body.category,
        priority: body.priority,
        location_text: body.location_text,
        latitude: body.latitude,
        longitude: body.longitude,
        ward_id: body.ward_id,
        department_id: body.department_id,
        source_message_id: body.source_message_id,
        media: Array.isArray(body.media) ? body.media : [],
      },
      {
        actorType: "system",
        note: "Complaint created via app/web chat mode",
      }
    );

    eventBus.emit("complaint:created", {
      complaint_id: complaint.id,
      complaint_number: complaint.complaint_number,
      channel: complaint.channel,
      status: complaint.status,
      source: "chat_mode",
    });

    res.status(201).json({
      success: true,
      mode: "chat",
      data: complaint,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

const aiService = require("../services/aiService");
const fs = require("fs");

const startVoiceSession = async (req, res, next) => {
  try {
    const { language = "English" } = req.body || {};
    
    // Initial request to AI to get a greeting in the specific language
    const prompt = `You are a civic portal agent. Greet the user and ask them how you can help with their civic complaint today. Respond only in ${language}.`;
    
    let audioBase64 = null;
    let message = `Hello! How can I help you with your complaint today?`;

    try {
        const greetingResponse = await aiService.chat(prompt, [], language);
        message = greetingResponse.response;
        audioBase64 = greetingResponse.audio_base64;
    } catch (e) {
        console.error("Failed to get AI greeting:", e);
    }

    res.status(200).json({
        session_id: `sess_${Date.now()}`,
        message: message,
        audio_base64: audioBase64,
    });
  } catch (error) {
    next(error);
  }
};

const endVoiceSession = async (req, res, next) => {
    try {
        const { session_id, history = [], transcript_full } = req.body;
        
        // 1. Classify/Extract from full transcript
        const fullText = transcript_full || history.map(h => h.content).join("\n");
        
        let category = "General";
        let summary = fullText;
        
        try {
            const extraction = await aiService.classify(fullText);
            category = extraction.top_label || "General";
            // Could also do extraction for summary
        } catch (e) {
            console.error("Classification failed:", e);
        }

        // 2. File Complaint
        const complaint = await createComplaintRecord(
            {
                phone_number: req.body.phone_number || "Anonymous",
                channel: "voice",
                raw_text: fullText,
                category: category,
                priority: "medium",
                source_call_id: session_id,
            },
            {
                actorType: "system",
                note: "Voice agent session finalized",
            }
        );

        res.status(201).json({
            success: true,
            data: complaint
        });
    } catch (error) {
        next(error);
    }
};

const createVoiceInteraction = async (req, res, next) => {
  try {
    const body = req.body || {};
    const file = req.file;
    const sessionId = isNonEmptyString(body.session_id) ? body.session_id.trim() : `sess_${Date.now()}`;
    const history = body.history ? JSON.parse(body.history) : []; // Expecting history as JSON string if multipart

    let transcript = "";
    let aiResponseText = "";
    let aiResponseAudio = "";

    // 1. Transcribe Audio
    if (file) {
      try {
        const transcriptionResult = await aiService.transcribe(file.path, body.language);
        transcript = transcriptionResult.text;
        
        // Cleanup uploaded file
        fs.unlink(file.path, (err) => {
          if (err) console.error("Failed to delete temp file:", err);
        });
      } catch (err) {
        console.error("Transcription failed:", err);
        transcript = "Audio processing failed.";
      }
    } else if (body.initial_text) {
      transcript = body.initial_text;
    }

    // 2. Chat with AI (Multi-turn)
    if (transcript) {
        try {
            const chatResult = await aiService.chat(transcript, history, body.language);
            aiResponseText = chatResult.response;
            aiResponseAudio = chatResult.audio_base64;
        } catch (err) {
            console.error("AI Chat failed:", err);
            aiResponseText = "Sorry, I am having trouble thinking right now.";
        }
    }

    res.status(200).json({
      success: true,
      session_id: sessionId,
      transcript: transcript,
      response_text: aiResponseText,
      audio_base64: aiResponseAudio,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

module.exports = {
  createChatInteraction,
  createVoiceInteraction,
  startVoiceSession,
  endVoiceSession,
};
