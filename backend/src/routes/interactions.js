const express = require("express");

const {
  createChatInteraction,
  createVoiceInteraction,
  startVoiceSession,
  endVoiceSession,
} = require("../controllers/interactionController");

const router = express.Router();

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

router.post("/chat", createChatInteraction);
router.post("/voice", upload.single("audio"), createVoiceInteraction);
router.post("/voice/start", startVoiceSession);
router.post("/voice/end", endVoiceSession);

module.exports = router;
