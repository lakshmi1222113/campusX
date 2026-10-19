
const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/authMiddleware");

const {
  getWantedItems,
  createWantedItem,
  updateWantedItem,
  deleteWantedItem,
} = require("../controllers/wantedItemController");

const router = express.Router();

// Public: view all wanted items.
// Private: mine=true requires a valid login.
router.get(
  "/",
  (req, res, next) => {
    if (req.query.mine === "true") {
      return protect(req, res, next);
    }

    return next();
  },
  asyncHandler(getWantedItems)
);

// Login required to create, update or delete requests.
router.post("/", protect, asyncHandler(createWantedItem));
router.patch("/:id", protect, asyncHandler(updateWantedItem));
router.delete("/:id", protect, asyncHandler(deleteWantedItem));

module.exports = router;
