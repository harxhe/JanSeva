const express = require("express");

const {
  createChatInteraction,
  transcribeVoiceNote,
} = require("../controllers/interactionController");

const router = express.Router();

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

router.post("/chat", createChatInteraction);
router.post("/voice/transcribe", upload.single("audio"), transcribeVoiceNote);

module.exports = router;
