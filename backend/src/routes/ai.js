const express = require("express");

const {
  saveTranscription,
  saveClassification,
  overrideClassification,
} = require("../controllers/aiController");

const router = express.Router();

router.post("/transcription", saveTranscription);
router.post("/classification", saveClassification);
router.patch("/classification/override", overrideClassification);

module.exports = router;
