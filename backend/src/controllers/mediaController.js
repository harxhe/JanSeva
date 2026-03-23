const { supabaseAdmin } = require("../client/supabase");
const { createHttpError, isNonEmptyString } = require("./complaintController");

const VALID_MEDIA_TYPES = new Set(["audio", "image"]);

const attachMediaMetadata = async (req, res, next) => {
  try {
    const complaintId = isNonEmptyString(req.params.complaint_id)
      ? req.params.complaint_id.trim()
      : "";
    const mediaType = isNonEmptyString(req.body?.media_type)
      ? req.body.media_type.trim().toLowerCase()
      : "";
    const storagePath = isNonEmptyString(req.body?.storage_path)
      ? req.body.storage_path.trim()
      : "";

    if (!complaintId) {
      throw createHttpError(400, "complaint_id is required");
    }
    if (!VALID_MEDIA_TYPES.has(mediaType)) {
      throw createHttpError(400, "media_type must be audio or image");
    }
    if (!storagePath) {
      throw createHttpError(400, "storage_path is required");
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
      .from("complaint_media")
      .insert({
        complaint_id: complaint.id,
        media_type: mediaType,
        storage_bucket: isNonEmptyString(req.body?.storage_bucket)
          ? req.body.storage_bucket.trim()
          : "complaint-evidence",
        storage_path: storagePath,
        mime_type: isNonEmptyString(req.body?.mime_type)
          ? req.body.mime_type.trim()
          : null,
        size_bytes:
          req.body?.size_bytes != null && !Number.isNaN(Number(req.body.size_bytes))
            ? Number(req.body.size_bytes)
            : null,
        duration_sec:
          req.body?.duration_sec != null &&
          !Number.isNaN(Number(req.body.duration_sec))
            ? Number(req.body.duration_sec)
            : null,
        checksum_sha256: isNonEmptyString(req.body?.checksum_sha256)
          ? req.body.checksum_sha256.trim()
          : null,
      })
      .select(
        "id, complaint_id, media_type, storage_bucket, storage_path, mime_type, size_bytes, duration_sec, checksum_sha256, uploaded_at"
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

const listComplaintMedia = async (req, res, next) => {
  try {
    const complaintId = isNonEmptyString(req.params.complaint_id)
      ? req.params.complaint_id.trim()
      : "";

    if (!complaintId) {
      throw createHttpError(400, "complaint_id is required");
    }

    const { data, error } = await supabaseAdmin
      .from("complaint_media")
      .select(
        "id, complaint_id, media_type, storage_bucket, storage_path, mime_type, size_bytes, duration_sec, checksum_sha256, uploaded_at"
      )
      .eq("complaint_id", complaintId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.status(200).json({ success: true, data: data || [] });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

module.exports = {
  attachMediaMetadata,
  listComplaintMedia,
};
