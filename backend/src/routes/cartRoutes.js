
const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/authMiddleware");

const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
} = require("../controllers/cartController");

const router = express.Router();

router.use(protect);

router.get("/", asyncHandler(getCart));
router.post("/", asyncHandler(addToCart));
router.patch("/:id", asyncHandler(updateCartItem));
router.delete("/:id", asyncHandler(removeFromCart));

module.exports = router;
