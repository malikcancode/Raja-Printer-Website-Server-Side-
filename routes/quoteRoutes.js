const express = require("express");
const router = express.Router();
const { sendQuoteRequest } = require("../controllers/quoteController");

// POST /api/quote
router.post("/", sendQuoteRequest);

module.exports = router;
