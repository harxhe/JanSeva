const { supabaseAdmin } = require("../client/supabase");
const eventBus = require("../realtime/eventBus");

const VALID_CHANNELS = new Set(["sms", "whatsapp", "voice"]);
const VALID_PRIORITIES = new Set(["low", "medium", "high", "critical"]);
const VALID_MEDIA_TYPES = new Set(["audio", "image"]);
const VALID_STATUSES = new Set([
  "received",
  "ai_classified",
  "pending_triage",
  "assigned",
  "in_progress",
  "resolved",
  "verified_closed",
  "need_more_info",
  "duplicate",
  "rejected",
  "escalated",
]);

const STATUS_TRANSITIONS = {
  received: new Set(["ai_classified", "pending_triage", "duplicate", "rejected"]),
  ai_classified: new Set(["pending_triage", "assigned", "duplicate", "rejected"]),
  pending_triage: new Set(["assigned", "need_more_info", "duplicate", "rejected"]),
  assigned: new Set(["in_progress", "need_more_info", "escalated"]),
  in_progress: new Set(["resolved", "escalated", "need_more_info"]),
  resolved: new Set(["verified_closed", "in_progress"]),
  verified_closed: new Set([]),
  need_more_info: new Set(["pending_triage", "assigned", "rejected"]),
  duplicate: new Set([]),
  rejected: new Set([]),
  escalated: new Set(["assigned", "in_progress", "resolved"]),
};

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const normalizeMedia = (media) => {
  if (!Array.isArray(media)) {
    return [];
  }

  return media.filter((item) => item && typeof item === "object");
};

const validateCreatePayload = (payload = {}) => {
  const phoneNumber = isNonEmptyString(payload.phone_number)
    ? payload.phone_number.trim()
    : "";
  const channel = isNonEmptyString(payload.channel)
    ? payload.channel.trim().toLowerCase()
    : "";
  const priority = isNonEmptyString(payload.priority)
    ? payload.priority.trim().toLowerCase()
    : "medium";

  if (!phoneNumber) {
    throw createHttpError(400, "phone_number is required");
  }

  if (!VALID_CHANNELS.has(channel)) {
    throw createHttpError(400, "channel must be sms, whatsapp, or voice");
  }

  if (!VALID_PRIORITIES.has(priority)) {
    throw createHttpError(400, "priority must be low, medium, high, or critical");
  }

  const media = normalizeMedia(payload.media);
  const hasText = isNonEmptyString(payload.raw_text);
  const hasMedia = media.length > 0;

  if (!hasText && !hasMedia) {
    throw createHttpError(400, "Either raw_text or at least one media item is required");
  }

  if (
    payload.latitude != null &&
    (Number(payload.latitude) < -90 || Number(payload.latitude) > 90)
  ) {
    throw createHttpError(400, "latitude must be between -90 and 90");
  }

  if (
    payload.longitude != null &&
    (Number(payload.longitude) < -180 || Number(payload.longitude) > 180)
  ) {
    throw createHttpError(400, "longitude must be between -180 and 180");
  }

  for (const item of media) {
    if (!VALID_MEDIA_TYPES.has(item.media_type)) {
      throw createHttpError(400, "media_type must be audio or image");
    }

    if (!isNonEmptyString(item.storage_path)) {
      throw createHttpError(400, "media.storage_path is required");
    }
  }

  return {
    phoneNumber,
    channel,
    priority,
    media,
    hasText,
  };
};

const createComplaintRecord = async (payload, options = {}) => {
  const { actorType = "system", note = "Complaint created" } = options;
  const validated = validateCreatePayload(payload);

  const citizenPayload = { phone_number: validated.phoneNumber };

  if (isNonEmptyString(payload.name)) {
    citizenPayload.name = payload.name.trim();
  }

  if (isNonEmptyString(payload.preferred_language)) {
    citizenPayload.preferred_language = payload.preferred_language.trim();
  }

  const { data: citizen, error: citizenError } = await supabaseAdmin
    .from("citizens")
    .upsert(citizenPayload, { onConflict: "phone_number" })
    .select("id")
    .single();

  if (citizenError) {
    throw citizenError;
  }

  const complaintPayload = {
    citizen_id: citizen.id,
    channel: validated.channel,
    raw_text: validated.hasText ? payload.raw_text.trim() : null,
    translated_text: isNonEmptyString(payload.translated_text)
      ? payload.translated_text.trim()
      : null,
    category: isNonEmptyString(payload.category)
      ? payload.category.trim().toLowerCase()
      : null,
    priority: validated.priority,
    location_text: isNonEmptyString(payload.location_text)
      ? payload.location_text.trim()
      : null,
    latitude: payload.latitude != null ? Number(payload.latitude) : null,
    longitude: payload.longitude != null ? Number(payload.longitude) : null,
    ward_id: payload.ward_id || null,
    department_id: payload.department_id || null,
    source_message_id: isNonEmptyString(payload.source_message_id)
      ? payload.source_message_id.trim()
      : null,
    source_call_id: isNonEmptyString(payload.source_call_id)
      ? payload.source_call_id.trim()
      : null,
  };

  const { data: complaint, error: complaintError } = await supabaseAdmin
    .from("complaints")
    .insert(complaintPayload)
    .select("id, complaint_number, status, channel, citizen_id, created_at")
    .single();

  if (complaintError) {
    if (complaintError.code === "23505") {
      throw createHttpError(409, "Duplicate source message/call id");
    }

    throw complaintError;
  }

  const { error: eventError } = await supabaseAdmin.from("complaint_events").insert({
    complaint_id: complaint.id,
    event_type: "complaint_created",
    old_value: null,
    new_value: { status: complaint.status },
    actor_type: actorType,
    note,
  });

  if (eventError) {
    throw eventError;
  }

  if (validated.media.length > 0) {
    const mediaRows = validated.media.map((item) => ({
      complaint_id: complaint.id,
      media_type: item.media_type,
      storage_bucket: isNonEmptyString(item.storage_bucket)
        ? item.storage_bucket.trim()
        : "complaint-evidence",
      storage_path: item.storage_path.trim(),
      mime_type: isNonEmptyString(item.mime_type) ? item.mime_type.trim() : null,
      size_bytes:
        item.size_bytes != null && !Number.isNaN(Number(item.size_bytes))
          ? Number(item.size_bytes)
          : null,
      duration_sec:
        item.duration_sec != null && !Number.isNaN(Number(item.duration_sec))
          ? Number(item.duration_sec)
          : null,
      checksum_sha256: isNonEmptyString(item.checksum_sha256)
        ? item.checksum_sha256.trim()
        : null,
    }));

    const { error: mediaError } = await supabaseAdmin
      .from("complaint_media")
      .insert(mediaRows);

    if (mediaError) {
      throw mediaError;
    }
  }

  return complaint;
};

const createComplaint = async (req, res, next) => {
  try {
    const complaint = await createComplaintRecord(req.body, {
      actorType: "system",
      note: "Complaint created via API",
    });

    eventBus.emit("complaint:created", {
      complaint_id: complaint.id,
      complaint_number: complaint.complaint_number,
      channel: complaint.channel,
      status: complaint.status,
      created_at: complaint.created_at,
    });

    res.status(201).json({ success: true, data: complaint });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

const listComplaints = async (req, res, next) => {
  try {
    const {
      status,
      priority,
      channel,
      ward_id,
      department_id,
      start_date,
      end_date,
      search,
      page = "1",
      limit = "20",
    } = req.query;

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const from = (safePage - 1) * safeLimit;
    const to = from + safeLimit - 1;

    let query = supabaseAdmin
      .from("complaints")
      .select(
        "id, complaint_number, status, channel, priority, category, location_text, ward_id, department_id, created_at, updated_at, citizens(phone_number, name)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (isNonEmptyString(status)) {
      query = query.eq("status", status.trim());
    }
    if (isNonEmptyString(priority)) {
      query = query.eq("priority", priority.trim());
    }
    if (isNonEmptyString(channel)) {
      query = query.eq("channel", channel.trim());
    }
    if (isNonEmptyString(ward_id)) {
      query = query.eq("ward_id", ward_id.trim());
    }
    if (isNonEmptyString(department_id)) {
      query = query.eq("department_id", department_id.trim());
    }
    if (isNonEmptyString(start_date)) {
      query = query.gte("created_at", start_date.trim());
    }
    if (isNonEmptyString(end_date)) {
      query = query.lte("created_at", end_date.trim());
    }
    if (isNonEmptyString(search)) {
      const term = search.trim().replaceAll(",", " ");
      query = query.or(
        `raw_text.ilike.%${term}%,location_text.ilike.%${term}%,category.ilike.%${term}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      data: data || [],
      meta: {
        page: safePage,
        limit: safeLimit,
        total: count || 0,
      },
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

const getComplaintById = async (req, res, next) => {
  try {
    const complaintId = isNonEmptyString(req.params.complaint_id)
      ? req.params.complaint_id.trim()
      : "";

    if (!complaintId) {
      throw createHttpError(400, "complaint_id is required");
    }

    const { data: complaint, error: complaintError } = await supabaseAdmin
      .from("complaints")
      .select(
        "id, complaint_number, status, channel, priority, category, raw_text, translated_text, location_text, latitude, longitude, citizen_id, ward_id, department_id, created_at, updated_at, resolved_at, citizens(phone_number, name, preferred_language)"
      )
      .eq("id", complaintId)
      .single();

    if (complaintError) {
      if (complaintError.code === "PGRST116") {
        throw createHttpError(404, "Complaint not found");
      }
      throw complaintError;
    }

    const [mediaResult, eventResult, aiResult, assignmentResult] = await Promise.all([
      supabaseAdmin
        .from("complaint_media")
        .select(
          "id, media_type, storage_bucket, storage_path, mime_type, size_bytes, duration_sec, checksum_sha256, uploaded_at"
        )
        .eq("complaint_id", complaint.id)
        .order("uploaded_at", { ascending: false }),
      supabaseAdmin
        .from("complaint_events")
        .select("id, event_type, old_value, new_value, actor_id, actor_type, note, created_at")
        .eq("complaint_id", complaint.id)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("ai_outputs")
        .select(
          "id, transcript_text, transcript_confidence, classification_label, classification_confidence, model_name, overridden_by_human, created_at"
        )
        .eq("complaint_id", complaint.id)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("assignments")
        .select(
          "id, assigned_to_id, assigned_to_type, assigned_by_id, due_at, is_active, created_at, updated_at"
        )
        .eq("complaint_id", complaint.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    if (mediaResult.error) {
      throw mediaResult.error;
    }
    if (eventResult.error) {
      throw eventResult.error;
    }
    if (aiResult.error) {
      throw aiResult.error;
    }
    if (assignmentResult.error) {
      throw assignmentResult.error;
    }

    res.status(200).json({
      success: true,
      data: {
        ...complaint,
        media: mediaResult.data || [],
        events: eventResult.data || [],
        ai_outputs: aiResult.data || [],
        active_assignment: assignmentResult.data?.[0] || null,
      },
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

const updateComplaintStatus = async (req, res, next) => {
  try {
    const complaintId = isNonEmptyString(req.params.complaint_id)
      ? req.params.complaint_id.trim()
      : "";
    const nextStatus = isNonEmptyString(req.body?.status)
      ? req.body.status.trim().toLowerCase()
      : "";
    const note = isNonEmptyString(req.body?.note) ? req.body.note.trim() : null;
    const actorId = isNonEmptyString(req.body?.actor_id) ? req.body.actor_id.trim() : null;
    const actorType = isNonEmptyString(req.body?.actor_type)
      ? req.body.actor_type.trim()
      : "admin";

    if (!complaintId) {
      throw createHttpError(400, "complaint_id is required");
    }
    if (!VALID_STATUSES.has(nextStatus)) {
      throw createHttpError(400, "Invalid status value");
    }

    const { data: complaint, error: complaintError } = await supabaseAdmin
      .from("complaints")
      .select("id, status, resolved_at")
      .eq("id", complaintId)
      .single();

    if (complaintError) {
      if (complaintError.code === "PGRST116") {
        throw createHttpError(404, "Complaint not found");
      }
      throw complaintError;
    }

    const currentStatus = complaint.status;
    if (currentStatus !== nextStatus) {
      const allowed = STATUS_TRANSITIONS[currentStatus] || new Set();
      if (!allowed.has(nextStatus)) {
        throw createHttpError(
          400,
          `Invalid status transition from ${currentStatus} to ${nextStatus}`
        );
      }
    }

    const updatePayload = { status: nextStatus };
    if (nextStatus === "resolved" && !complaint.resolved_at) {
      updatePayload.resolved_at = new Date().toISOString();
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("complaints")
      .update(updatePayload)
      .eq("id", complaintId)
      .select("id, complaint_number, status, resolved_at, updated_at")
      .single();

    if (updateError) {
      throw updateError;
    }

    const { error: eventError } = await supabaseAdmin.from("complaint_events").insert({
      complaint_id: complaintId,
      event_type: "status_changed",
      old_value: { status: currentStatus },
      new_value: { status: nextStatus },
      actor_id: actorId,
      actor_type: actorType,
      note,
    });

    if (eventError) {
      throw eventError;
    }

    eventBus.emit("complaint:status_updated", {
      complaint_id: updated.id,
      complaint_number: updated.complaint_number,
      status: updated.status,
      resolved_at: updated.resolved_at,
      updated_at: updated.updated_at,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

const readComplaint = async (req, res, next) => {
  try {
    const complaintNo = Number(req.params.complaint_no);
    if (!Number.isInteger(complaintNo) || complaintNo <= 0) {
      throw createHttpError(400, "complaint_no must be a positive integer");
    }

    const { data: complaint, error } = await supabaseAdmin
      .from("complaints")
      .select("id")
      .eq("complaint_number", complaintNo)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw createHttpError(404, "Complaint not found");
      }
      throw error;
    }

    req.params.complaint_id = complaint.id;
    return getComplaintById(req, res, next);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

const deleteComplaint = async (req, res, next) => {
  try {
    const complaintId = isNonEmptyString(req.params.complaint_id)
      ? req.params.complaint_id.trim()
      : "";

    if (!complaintId) {
      throw createHttpError(400, "complaint_id is required");
    }

    const { data: complaint, error: complaintError } = await supabaseAdmin
      .from("complaints")
      .select("id, complaint_number")
      .eq("id", complaintId)
      .single();

    if (complaintError) {
      if (complaintError.code === "PGRST116") {
        throw createHttpError(404, "Complaint not found");
      }
      throw complaintError;
    }

    const { error: deleteError } = await supabaseAdmin
      .from("complaints")
      .delete()
      .eq("id", complaintId);

    if (deleteError) {
      throw deleteError;
    }

    eventBus.emit("complaint:deleted", {
      complaint_id: complaint.id,
      complaint_number: complaint.complaint_number,
      deleted_at: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      message: "Complaint deleted successfully",
      data: { id: complaint.id, complaint_number: complaint.complaint_number },
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

module.exports = {
  createComplaint,
  createComplaintRecord,
  listComplaints,
  getComplaintById,
  updateComplaintStatus,
  readComplaint,
  deleteComplaint,
  createHttpError,
  isNonEmptyString,
};
