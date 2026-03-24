const { createComplaintRecord } = require("./complaintController");
const eventBus = require("../realtime/eventBus");
const aiService = require("../services/aiService");
const fs = require("fs");
const { supabaseAdmin } = require("../client/supabase");

const createChatInteraction = async (req, res, next) => {
  try {
    const body = req.body || {};
    const text = body.message_text;

    let category = body.category;
    let classificationConfidence = null;

    if (!category && text) {
      try {
        const classification = await aiService.classify(text);
        category = classification.top_label || "General";
        classificationConfidence = classification.top_confidence || null;
      } catch (e) {
        console.error("Classification failed:", e);
        category = "General";
      }
    }

    const complaint = await createComplaintRecord(
      {
        phone_number: body.phone_number,
        name: body.name,
        preferred_language: body.preferred_language,
        channel: body.channel || "app",
        raw_text: text,
        category: category,
        priority: body.priority || "medium",
        media: Array.isArray(body.media) ? body.media : [],
      },
      {
        actorType: "system",
        note: "Complaint created via v0.5 chat interaction",
      }
    );

    if (category !== "General" || classificationConfidence) {
        await supabaseAdmin.from("ai_outputs").insert({
            complaint_id: complaint.id,
            classification_label: category,
            model_name: "v0.5-classifier"
        });
    }

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

const transcribeVoiceNote = async (req, res, next) => {
  try {
    const file = req.file;
    const body = req.body || {};
    const language = body.language || "English";

    if (!file) {
      return res.status(400).json({ success: false, error: "No audio file provided" });
    }

    let transcript = "";
    try {
      const transcriptionResult = await aiService.transcribe(file.path, language);
      transcript = transcriptionResult.text;
    } catch (err) {
      console.error("Transcription failed:", err);
      transcript = "Audio processing failed.";
    } finally {
      fs.unlink(file.path, (err) => {
        if (err) console.error("Failed to delete temp file:", err);
      });
    }

    res.status(200).json({
      success: true,
      transcript: transcript,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createChatInteraction,
  transcribeVoiceNote,
};
