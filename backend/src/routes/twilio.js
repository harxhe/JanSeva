const express = require("express");

const {
  intakeSms,
  intakeWhatsapp,
  intakeVoice,
} = require("../controllers/intakeController");

const router = express.Router();

router.post("/sms", intakeSms);
router.post("/whatsapp", intakeWhatsapp);
router.post("/voice", intakeVoice);

module.exports = router;
