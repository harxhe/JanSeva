const express = require("express");

const {
  attachMediaMetadata,
  listComplaintMedia,
} = require("../controllers/mediaController");

const router = express.Router();

router.post("/complaints/:complaint_id", attachMediaMetadata);
router.get("/complaints/:complaint_id", listComplaintMedia);

module.exports = router;
