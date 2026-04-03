const express = require("express");

const {
  previewComplaintInteraction,
  createChatInteraction,
  transcribeVoiceNote,
  createVoiceInteraction,
} = require("../controllers/interactionController");

const router = express.Router();

const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const parseAnyAudioUpload = upload.any();

router.post("/chat", createChatInteraction);
router.post("/preview", previewComplaintInteraction);
router.post("/voice/transcribe", parseAnyAudioUpload, transcribeVoiceNote);
router.post("/voice/submit", parseAnyAudioUpload, createVoiceInteraction);

module.exports = router;
