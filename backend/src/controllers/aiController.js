const { supabaseAdmin } = require("../client/supabase");
const { createHttpError, isNonEmptyString } = require("./complaintController");

const saveTranscription = async (req, res, next) => {
  try {
    const complaintId = isNonEmptyString(req.body?.complaint_id)
      ? req.body.complaint_id.trim()
      : "";
    const transcriptText = isNonEmptyString(req.body?.transcript_text)
      ? req.body.transcript_text.trim()
      : "";

    if (!complaintId || !transcriptText) {
      throw createHttpError(400, "complaint_id and transcript_text are required");
    }

    const { data: complaint, error: complaintError } = await supabaseAdmin
      .from("complaints")
      .select("id")
      .eq("id", complaintId)
      .single();

    if (complaintError) {
      if (complaintError.code === "PGRST116") {
        throw createHttpError(404, "Complaint not found");
      }
      throw complaintError;
    }

    const { data, error } = await supabaseAdmin
      .from("ai_outputs")
      .insert({
        complaint_id: complaint.id,
        transcript_text: transcriptText,
        transcript_confidence:
          req.body?.transcript_confidence != null
            ? Number(req.body.transcript_confidence)
            : null,
        model_name: isNonEmptyString(req.body?.model_name)
          ? req.body.model_name.trim()
          : "whisper",
      })
      .select(
        "id, complaint_id, transcript_text, transcript_confidence, classification_label, classification_confidence, model_name, overridden_by_human, created_at"
      )
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({ success: true, data });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

const saveClassification = async (req, res, next) => {
  try {
    const complaintId = isNonEmptyString(req.body?.complaint_id)
      ? req.body.complaint_id.trim()
      : "";
    const classificationLabel = isNonEmptyString(req.body?.classification_label)
      ? req.body.classification_label.trim().toLowerCase()
      : "";

    if (!complaintId || !classificationLabel) {
      throw createHttpError(400, "complaint_id and classification_label are required");
    }

    const { data: complaint, error: complaintError } = await supabaseAdmin
      .from("complaints")
      .select("id, status")
      .eq("id", complaintId)
      .single();

    if (complaintError) {
      if (complaintError.code === "PGRST116") {
        throw createHttpError(404, "Complaint not found");
      }
      throw complaintError;
    }

    const { data, error } = await supabaseAdmin
      .from("ai_outputs")
      .insert({
        complaint_id: complaint.id,
        classification_label: classificationLabel,
        classification_confidence:
          req.body?.classification_confidence != null
            ? Number(req.body.classification_confidence)
            : null,
        model_name: isNonEmptyString(req.body?.model_name)
          ? req.body.model_name.trim()
          : "classifier-v1",
      })
      .select(
        "id, complaint_id, transcript_text, transcript_confidence, classification_label, classification_confidence, model_name, overridden_by_human, created_at"
      )
      .single();

    if (error) {
      throw error;
    }

    const statusUpdate = complaint.status === "received" ? "ai_classified" : complaint.status;

    const { error: complaintUpdateError } = await supabaseAdmin
      .from("complaints")
      .update({ category: classificationLabel, status: statusUpdate })
      .eq("id", complaint.id);

    if (complaintUpdateError) {
      throw complaintUpdateError;
    }

    const { error: eventError } = await supabaseAdmin.from("complaint_events").insert({
      complaint_id: complaint.id,
      event_type: "ai_classified",
      old_value: null,
      new_value: { category: classificationLabel },
      actor_type: "system",
      note: "AI classification saved",
    });

    if (eventError) {
      throw eventError;
    }

    res.status(201).json({ success: true, data });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

const overrideClassification = async (req, res, next) => {
  try {
    const complaintId = isNonEmptyString(req.body?.complaint_id)
      ? req.body.complaint_id.trim()
      : "";
    const classificationLabel = isNonEmptyString(req.body?.classification_label)
      ? req.body.classification_label.trim().toLowerCase()
      : "";
    const actorId = isNonEmptyString(req.body?.actor_id) ? req.body.actor_id.trim() : null;
    const note = isNonEmptyString(req.body?.note) ? req.body.note.trim() : "AI classification overridden";

    if (!complaintId || !classificationLabel) {
      throw createHttpError(400, "complaint_id and classification_label are required");
    }

    const { data: latestAi, error: latestError } = await supabaseAdmin
      .from("ai_outputs")
      .select("id")
      .eq("complaint_id", complaintId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (latestError) {
      throw latestError;
    }

    if (latestAi?.[0]?.id) {
      const { error: markError } = await supabaseAdmin
        .from("ai_outputs")
        .update({ overridden_by_human: true })
        .eq("id", latestAi[0].id);

      if (markError) {
        throw markError;
      }
    }

    const { data, error } = await supabaseAdmin
      .from("ai_outputs")
      .insert({
        complaint_id: complaintId,
        classification_label: classificationLabel,
        overridden_by_human: true,
        model_name: "manual-override",
      })
      .select(
        "id, complaint_id, transcript_text, transcript_confidence, classification_label, classification_confidence, model_name, overridden_by_human, created_at"
      )
      .single();

    if (error) {
      throw error;
    }

    const { error: complaintUpdateError } = await supabaseAdmin
      .from("complaints")
      .update({ category: classificationLabel })
      .eq("id", complaintId);

    if (complaintUpdateError) {
      throw complaintUpdateError;
    }

    const { error: eventError } = await supabaseAdmin.from("complaint_events").insert({
      complaint_id: complaintId,
      event_type: "classification_overridden",
      old_value: null,
      new_value: { category: classificationLabel },
      actor_id: actorId,
      actor_type: "admin",
      note,
    });

    if (eventError) {
      throw eventError;
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

module.exports = {
  saveTranscription,
  saveClassification,
  overrideClassification,
};
