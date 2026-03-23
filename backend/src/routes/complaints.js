const express = require("express");

const {
  createComplaint,
  listComplaints,
  getComplaintById,
  updateComplaintStatus,
  readComplaint,
  deleteComplaint,
} = require("../controllers/complaintController");

const router = express.Router();

router.post("/", createComplaint);
router.post("/createComplaints", createComplaint);
router.get("/", listComplaints);
router.get("/number/:complaint_no", readComplaint);
router.get("/:complaint_id", getComplaintById);
router.patch("/:complaint_id/status", updateComplaintStatus);
router.delete("/:complaint_id", deleteComplaint);

module.exports = router;
