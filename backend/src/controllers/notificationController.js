const { supabaseAdmin } = require("../client/supabase");
const { createHttpError, isNonEmptyString } = require("./complaintController");

const VALID_NOTIFICATION_STATUS = new Set(["queued", "sent", "delivered", "failed"]);
const VALID_CHANNELS = new Set(["sms", "whatsapp", "voice"]);

const queueNotification = async (req, res, next) => {
  try {
    const complaintId = isNonEmptyString(req.body?.complaint_id)
      ? req.body.complaint_id.trim()
      : "";
    const channel = isNonEmptyString(req.body?.channel)
      ? req.body.channel.trim().toLowerCase()
      : "";

    if (!complaintId || !channel) {
      throw createHttpError(400, "complaint_id and channel are required");
    }
    if (!VALID_CHANNELS.has(channel)) {
      throw createHttpError(400, "Invalid notification channel");
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
      .from("notifications")
      .insert({
        complaint_id: complaint.id,
        channel,
        template_key: isNonEmptyString(req.body?.template_key)
          ? req.body.template_key.trim()
          : null,
        delivery_status: "queued",
      })
      .select("id, complaint_id, channel, template_key, delivery_status, created_at")
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

const listNotificationsByComplaint = async (req, res, next) => {
  try {
    const complaintId = isNonEmptyString(req.params.complaint_id)
      ? req.params.complaint_id.trim()
      : "";

    if (!complaintId) {
      throw createHttpError(400, "complaint_id is required");
    }

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select(
        "id, complaint_id, channel, template_key, delivery_status, provider_message_id, error_message, sent_at, created_at"
      )
      .eq("complaint_id", complaintId)
      .order("created_at", { ascending: false });

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

const markNotificationStatus = async (req, res, next) => {
  try {
    const notificationId = isNonEmptyString(req.params.notification_id)
      ? req.params.notification_id.trim()
      : "";
    const deliveryStatus = isNonEmptyString(req.body?.delivery_status)
      ? req.body.delivery_status.trim().toLowerCase()
      : "";

    if (!notificationId || !deliveryStatus) {
      throw createHttpError(400, "notification_id and delivery_status are required");
    }
    if (!VALID_NOTIFICATION_STATUS.has(deliveryStatus)) {
      throw createHttpError(400, "Invalid delivery_status");
    }

    const updatePayload = {
      delivery_status: deliveryStatus,
      provider_message_id: isNonEmptyString(req.body?.provider_message_id)
        ? req.body.provider_message_id.trim()
        : null,
      error_message: isNonEmptyString(req.body?.error_message)
        ? req.body.error_message.trim()
        : null,
    };

    if (deliveryStatus === "sent" || deliveryStatus === "delivered") {
      updatePayload.sent_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .update(updatePayload)
      .eq("id", notificationId)
      .select(
        "id, complaint_id, channel, template_key, delivery_status, provider_message_id, error_message, sent_at, created_at"
      )
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw createHttpError(404, "Notification not found");
      }
      throw error;
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
  queueNotification,
  listNotificationsByComplaint,
  markNotificationStatus,
};
