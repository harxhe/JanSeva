const express = require("express");

const {
  assignComplaint,
  reassignComplaint,
  closeAssignment,
} = require("../controllers/assignmentController");

const router = express.Router();

router.post("/", assignComplaint);
router.patch("/:assignment_id/reassign", reassignComplaint);
router.patch("/:assignment_id/close", closeAssignment);

module.exports = router;
