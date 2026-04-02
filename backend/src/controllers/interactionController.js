const { createComplaintRecord } = require("./complaintController");
const eventBus = require("../realtime/eventBus");
const aiService = require("../services/aiService");
const fs = require("fs");
const path = require("path");
const { supabaseAdmin } = require("../client/supabase");

const DEFAULT_CATEGORY = "General";
const DEFAULT_PRIORITY = "medium";

const normalizeAiCategory = (value) =>
  typeof value === "string" && value.trim() ? value.trim().toLowerCase() : DEFAULT_CATEGORY.toLowerCase();

const normalizePriority = (value) =>
  typeof value === "string" && value.trim() ? value.trim().toLowerCase() : DEFAULT_PRIORITY;

const classifyComplaintText = async (text, initialCategory, initialPriority) => {
  let category = initialCategory;
  let priority = initialPriority;
  let classificationConfidence = null;
  let modelName = null;

  if (!category && text) {
    try {
      const extraction = await aiService.extract(text);
      category = extraction.category || DEFAULT_CATEGORY;
      priority = extraction.urgency || priority || DEFAULT_PRIORITY;
      classificationConfidence = extraction.confidence || null;
      modelName = extraction.model_name || null;
    } catch (error) {
      console.error("Extraction failed:", error);
    }
  }

  if (!category && text) {
    try {
      const classification = await aiService.classify(text);
      category = classification.top_label || DEFAULT_CATEGORY;
      const score = classification.scores?.[classification.top_label];
      classificationConfidence = typeof score === "number" ? score : classificationConfidence;
      modelName = classification.model_name || modelName;
    } catch (error) {
      console.error("Classification failed:", error);
      category = DEFAULT_CATEGORY;
    }
  }

  return {
    category: normalizeAiCategory(category),
    priority: normalizePriority(priority),
    classificationConfidence,
    modelName,
  };
};

const persistAiResult = async (complaint, payload = {}) => {
  const nextStatus = complaint.status === "received" ? "ai_classified" : complaint.status;
  const aiOutputPayload = {
    complaint_id: complaint.id,
    classification_label: payload.category,
    classification_confidence: payload.classificationConfidence,
    transcript_text: payload.transcriptText || null,
    transcript_confidence: payload.transcriptConfidence ?? null,
    model_name: payload.modelName || "v0.5-classifier",
  };

  const { error: aiOutputError } = await supabaseAdmin.from("ai_outputs").insert(aiOutputPayload);

  if (aiOutputError) {
    throw aiOutputError;
  }

  if (nextStatus !== complaint.status) {
    const { error: complaintUpdateError } = await supabaseAdmin
      .from("complaints")
      .update({ status: nextStatus, category: payload.category, priority: payload.priority })
      .eq("id", complaint.id);

    if (complaintUpdateError) {
      throw complaintUpdateError;
    }

    const { error: eventError } = await supabaseAdmin.from("complaint_events").insert({
      complaint_id: complaint.id,
      event_type: "ai_classified",
      old_value: { status: complaint.status },
      new_value: { status: nextStatus, category: payload.category, priority: payload.priority },
      actor_type: "system",
      note: payload.note || "AI classification applied during intake",
    });

    if (eventError) {
      throw eventError;
    }

    complaint.status = nextStatus;
  }

  complaint.category = payload.category;
  complaint.priority = payload.priority;

  return complaint;
};

const emitComplaintCreated = (complaint, source) => {
  eventBus.emit("complaint:created", {
    complaint_id: complaint.id,
    complaint_number: complaint.complaint_number,
    channel: complaint.channel,
    status: complaint.status,
    source,
  });
};

const createChatInteraction = async (req, res, next) => {
  try {
    const body = req.body || {};
    const text = body.message_text;
    const classification = await classifyComplaintText(text, body.category, body.priority);

    const complaint = await createComplaintRecord(
      {
        phone_number: body.phone_number,
        name: body.name,
        preferred_language: body.preferred_language,
        channel: body.channel || "app",
        raw_text: text,
        category: classification.category,
        priority: classification.priority,
        media: Array.isArray(body.media) ? body.media : [],
      },
      {
        actorType: "system",
        note: "Complaint created via v0.5 chat interaction",
      }
    );

    if (text) {
      await persistAiResult(complaint, {
        ...classification,
        note: "AI classification applied during chat intake",
      });
    }

    emitComplaintCreated(complaint, "chat_mode");

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
    let transcriptionConfidence = 0;
    let modelName = null;

    try {
      const transcriptionResult = await aiService.transcribe(file.path, language);
      transcript = transcriptionResult.text;
      transcriptionConfidence = transcriptionResult.confidence ?? 0;
      modelName = transcriptionResult.model_name || null;
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
      transcript,
      confidence: transcriptionConfidence,
      model_name: modelName,
    });
  } catch (error) {
    next(error);
  }
};

const createVoiceInteraction = async (req, res, next) => {
  const file = req.file;

  try {
    const body = req.body || {};
    const language = body.language || "English";

    if (!file) {
      return res.status(400).json({ success: false, error: "No audio file provided" });
    }

    let transcriptText = typeof body.transcript_text === "string" ? body.transcript_text.trim() : "";
    let transcriptConfidence =
      body.transcript_confidence != null && !Number.isNaN(Number(body.transcript_confidence))
        ? Number(body.transcript_confidence)
        : null;
    let transcriptionModelName =
      typeof body.transcription_model_name === "string" && body.transcription_model_name.trim()
        ? body.transcription_model_name.trim()
        : null;

    if (!transcriptText) {
      const transcriptionResult = await aiService.transcribe(file.path, language);
      transcriptText = transcriptionResult.text || "";
      transcriptConfidence = transcriptionResult.confidence ?? transcriptConfidence;
      transcriptionModelName = transcriptionResult.model_name || transcriptionModelName;
    }

    if (!transcriptText) {
      return res.status(400).json({ success: false, error: "Transcript is required to file a voice complaint" });
    }

    const classification = await classifyComplaintText(transcriptText, body.category, body.priority);
    const relativeStoragePath = path.basename(file.path);

    const complaint = await createComplaintRecord(
      {
        phone_number: body.phone_number,
        name: body.name,
        preferred_language: body.preferred_language,
        channel: "voice",
        raw_text: transcriptText,
        category: classification.category,
        priority: classification.priority,
        media: [
          {
            media_type: "audio",
            storage_bucket: "local-uploads",
            storage_path: relativeStoragePath,
            mime_type: file.mimetype,
            size_bytes: file.size,
          },
        ],
      },
      {
        actorType: "system",
        note: "Complaint created via voice interaction",
      }
    );

    await persistAiResult(complaint, {
      ...classification,
      transcriptText,
      transcriptConfidence,
      modelName: transcriptionModelName || classification.modelName || "whisper",
      note: "AI transcript and classification applied during voice intake",
    });

    emitComplaintCreated(complaint, "voice_mode");

    res.status(201).json({
      success: true,
      mode: "voice",
      data: complaint,
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
  transcribeVoiceNote,
  createVoiceInteraction,
};
