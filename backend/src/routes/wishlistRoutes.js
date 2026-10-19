
const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/authMiddleware");

const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require("../controllers/wishlistController");

const router = express.Router();

router.use(protect);

router.get("/", asyncHandler(getWishlist));
router.post("/", asyncHandler(addToWishlist));
router.delete("/:id", asyncHandler(removeFromWishlist));

module.exports = router;
