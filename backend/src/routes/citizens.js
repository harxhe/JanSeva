const express = require("express");

const {
  getCitizenByPhone,
  getCitizenHistory,
} = require("../controllers/citizenController");

const router = express.Router();

router.get("/:phone_number", getCitizenByPhone);
router.get("/:phone_number/history", getCitizenHistory);

module.exports = router;
