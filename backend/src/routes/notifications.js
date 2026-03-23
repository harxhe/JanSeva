const express = require("express");

const {
  queueNotification,
  listNotificationsByComplaint,
  markNotificationStatus,
} = require("../controllers/notificationController");

const router = express.Router();

router.post("/", queueNotification);
router.get("/complaints/:complaint_id", listNotificationsByComplaint);
router.patch("/:notification_id/status", markNotificationStatus);

module.exports = router;
