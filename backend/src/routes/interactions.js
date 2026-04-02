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

router.post("/chat", createChatInteraction);
router.post("/preview", previewComplaintInteraction);
router.post("/voice/transcribe", upload.single("audio"), transcribeVoiceNote);
router.post("/voice/submit", upload.single("audio"), createVoiceInteraction);

module.exports = router;
