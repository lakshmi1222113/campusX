
const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const {
  protect,
  optionalProtect,
} = require("../middleware/authMiddleware");
const uploadListingImage = require("../middleware/uploadMiddleware");
const HttpError = require("../utils/httpError");

const {
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  getMyListings,
} = require("../controllers/listingController");

const router = express.Router();

function handleListingImageUpload(req, res, next) {
  uploadListingImage(req, res, (error) => {
    if (error) {
      return next(new HttpError(400, error.message));
    }

    next();
  });
}

// Public browsing; logged-in users get college-priority sorting.
router.get(
  "/",
  optionalProtect,
  asyncHandler(getListings)
);

router.get("/mine", protect, asyncHandler(getMyListings));
router.get("/:id", asyncHandler(getListingById));

router.post(
  "/",
  protect,
  handleListingImageUpload,
  asyncHandler(createListing)
);

router.patch("/:id", protect, asyncHandler(updateListing));
router.delete("/:id", protect, asyncHandler(deleteListing));

module.exports = router;
