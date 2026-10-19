
const express = require("express");
const asyncHandler = require("../utils/asyncHandler");

const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.get("/me", protect, asyncHandler(getMe));

// Profile management
router.patch("/profile", protect, asyncHandler(updateProfile));
router.patch("/change-password", protect, asyncHandler(changePassword));

module.exports = router;
