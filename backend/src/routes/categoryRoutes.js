const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { getCategories, createCategory } = require("../controllers/categoryController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();
router.get("/", asyncHandler(getCategories));
router.post("/", protect, adminOnly, asyncHandler(createCategory));

module.exports = router;
