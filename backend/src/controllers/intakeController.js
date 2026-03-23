const {
  createComplaintRecord,
  createHttpError,
  isNonEmptyString,
} = require("./complaintController");
const eventBus = require("../realtime/eventBus");

const escapeXml = (unsafe = "") =>
  unsafe
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const collectMediaFromTwilio = (body, complaintId, folderName) => {
  const media = [];
  const numMedia = Number(body?.NumMedia || 0);

  for (let i = 0; i < numMedia; i += 1) {
    const mediaUrl = body[`MediaUrl${i}`];
    const contentType = body[`MediaContentType${i}`];

    if (!isNonEmptyString(mediaUrl) || !isNonEmptyString(contentType)) {
      continue;
    }

    const mediaType = contentType.startsWith("audio/") ? "audio" : "image";

    media.push({
      media_type: mediaType,
      storage_bucket: "complaint-evidence",
      storage_path: `${complaintId}/${folderName}/twilio-media-${i}`,
      mime_type: contentType,
      checksum_sha256: null,
    });
  }

  return media;
};

const intakeSms = async (req, res, next) => {
  try {
    const from = isNonEmptyString(req.body?.From) ? req.body.From.trim() : "";
    const bodyText = isNonEmptyString(req.body?.Body) ? req.body.Body.trim() : "";
    const messageSid = isNonEmptyString(req.body?.MessageSid)
      ? req.body.MessageSid.trim()
      : null;

    if (!from) {
      throw createHttpError(400, "Missing sender number");
    }

    const complaint = await createComplaintRecord(
      {
        phone_number: from,
        channel: "sms",
        raw_text: bodyText || "Media complaint received",
        source_message_id: messageSid,
      },
      {
        actorType: "system",
        note: "Complaint created via Twilio SMS webhook",
      }
    );

    const message = escapeXml(
      `Complaint #${complaint.complaint_number} received. We will keep you updated.`
    );

    eventBus.emit("complaint:created", {
      complaint_id: complaint.id,
      complaint_number: complaint.complaint_number,
      channel: "sms",
      status: complaint.status,
      source: "twilio_sms",
    });

    res.status(200).type("text/xml").send(`<Response><Message>${message}</Message></Response>`);
  } catch (error) {
    if (error.statusCode === 409) {
      res.status(200).type("text/xml").send("<Response></Response>");
      return;
    }

    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

const intakeWhatsapp = async (req, res, next) => {
  try {
    const from = isNonEmptyString(req.body?.From) ? req.body.From.replace("whatsapp:", "").trim() : "";
    const bodyText = isNonEmptyString(req.body?.Body) ? req.body.Body.trim() : "";
    const messageSid = isNonEmptyString(req.body?.MessageSid)
      ? req.body.MessageSid.trim()
      : null;

    if (!from) {
      throw createHttpError(400, "Missing sender number");
    }

    const tempComplaintId = messageSid || `wa-${Date.now()}`;
    const media = collectMediaFromTwilio(req.body, tempComplaintId, "whatsapp");

    const complaint = await createComplaintRecord(
      {
        phone_number: from,
        channel: "whatsapp",
        raw_text: bodyText || "WhatsApp media complaint",
        source_message_id: messageSid,
        media,
      },
      {
        actorType: "system",
        note: "Complaint created via Twilio WhatsApp webhook",
      }
    );

    const message = escapeXml(
      `Complaint #${complaint.complaint_number} received. Team has been notified.`
    );

    eventBus.emit("complaint:created", {
      complaint_id: complaint.id,
      complaint_number: complaint.complaint_number,
      channel: "whatsapp",
      status: complaint.status,
      source: "twilio_whatsapp",
    });

    res.status(200).type("text/xml").send(`<Response><Message>${message}</Message></Response>`);
  } catch (error) {
    if (error.statusCode === 409) {
      res.status(200).type("text/xml").send("<Response></Response>");
      return;
    }

    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

const intakeVoice = async (req, res, next) => {
  try {
    const from = isNonEmptyString(req.body?.From) ? req.body.From.trim() : "";
    const callSid = isNonEmptyString(req.body?.CallSid) ? req.body.CallSid.trim() : null;
    const recordingUrl = isNonEmptyString(req.body?.RecordingUrl)
      ? req.body.RecordingUrl.trim()
      : "";
    const recordingDuration = req.body?.RecordingDuration;

    if (!from) {
      throw createHttpError(400, "Missing caller number");
    }

    const media = recordingUrl
      ? [
          {
            media_type: "audio",
            storage_bucket: "complaint-evidence",
            storage_path: `${callSid || Date.now()}/voice/call-recording`,
            mime_type: "audio/mpeg",
            duration_sec:
              recordingDuration != null && !Number.isNaN(Number(recordingDuration))
                ? Number(recordingDuration)
                : null,
          },
        ]
      : [];

    const complaint = await createComplaintRecord(
      {
        phone_number: from,
        channel: "voice",
        raw_text: "Voice complaint received. Transcript pending.",
        source_call_id: callSid,
        media,
      },
      {
        actorType: "system",
        note: "Complaint created via Twilio Voice webhook",
      }
    );

    const message = escapeXml(`Complaint ${complaint.complaint_number} registered successfully.`);

    eventBus.emit("complaint:created", {
      complaint_id: complaint.id,
      complaint_number: complaint.complaint_number,
      channel: "voice",
      status: complaint.status,
      source: "twilio_voice",
    });

    eventBus.emit("call:incoming", {
      complaint_id: complaint.id,
      complaint_number: complaint.complaint_number,
      phone_number: from,
      call_sid: callSid,
      timestamp: Date.now(),
    });

    res.status(200).type("text/xml").send(`<Response><Say>${message}</Say></Response>`);
  } catch (error) {
    if (error.statusCode === 409) {
      res.status(200).type("text/xml").send("<Response></Response>");
      return;
    }

    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

module.exports = {
  intakeSms,
  intakeWhatsapp,
  intakeVoice,
};
