const { createComplaintRecord } = require("./complaintController");
const eventBus = require("../realtime/eventBus");
const aiService = require("../services/aiService");
const fs = require("fs");
const { supabaseAdmin } = require("../client/supabase");

const DEFAULT_CATEGORY = "General";

const normalizeAiCategory = (value) =>
  typeof value === "string" && value.trim() ? value.trim().toLowerCase() : DEFAULT_CATEGORY.toLowerCase();

const createChatInteraction = async (req, res, next) => {
  try {
    const body = req.body || {};
    const text = body.message_text;

    let category = body.category;
    let priority = body.priority;
    let classificationConfidence = null;
    let modelName = null;

    if (!category && text) {
      try {
        const extraction = await aiService.extract(text);
        category = extraction.category || DEFAULT_CATEGORY;
        priority = extraction.urgency || priority || "medium";
        classificationConfidence = extraction.confidence || null;
        modelName = extraction.model_name || null;
      } catch (e) {
        console.error("Extraction failed:", e);
      }
    }

    if (!category && text) {
      try {
        const classification = await aiService.classify(text);
        category = classification.top_label || DEFAULT_CATEGORY;
        const score = classification.scores?.[classification.top_label];
        classificationConfidence = typeof score === "number" ? score : classificationConfidence;
        modelName = classification.model_name || modelName;
      } catch (e) {
        console.error("Classification failed:", e);
        category = DEFAULT_CATEGORY;
      }
    }

    category = normalizeAiCategory(category);
    priority = typeof priority === "string" && priority.trim() ? priority.trim().toLowerCase() : "medium";

    const complaint = await createComplaintRecord(
      {
        phone_number: body.phone_number,
        name: body.name,
        preferred_language: body.preferred_language,
        channel: body.channel || "app",
        raw_text: text,
        category,
        priority,
        media: Array.isArray(body.media) ? body.media : [],
      },
      {
        actorType: "system",
        note: "Complaint created via v0.5 chat interaction",
      }
    );

    if (text) {
      const { error: aiOutputError } = await supabaseAdmin.from("ai_outputs").insert({
        complaint_id: complaint.id,
        classification_label: category,
        classification_confidence: classificationConfidence,
        model_name: modelName || "v0.5-classifier",
      });

      if (aiOutputError) {
        throw aiOutputError;
      }

      const nextStatus = complaint.status === "received" ? "ai_classified" : complaint.status;

      if (nextStatus !== complaint.status) {
        const { error: complaintUpdateError } = await supabaseAdmin
          .from("complaints")
          .update({ status: nextStatus, category, priority })
          .eq("id", complaint.id);

        if (complaintUpdateError) {
          throw complaintUpdateError;
        }

        const { error: eventError } = await supabaseAdmin.from("complaint_events").insert({
          complaint_id: complaint.id,
          event_type: "ai_classified",
          old_value: { status: complaint.status },
          new_value: { status: nextStatus, category, priority },
          actor_type: "system",
          note: "AI classification applied during chat intake",
        });

        if (eventError) {
          throw eventError;
        }

        complaint.status = nextStatus;
      }

      complaint.category = category;
      complaint.priority = priority;
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
