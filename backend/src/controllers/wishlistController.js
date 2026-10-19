
const prisma = require("../config/prisma");
const HttpError = require("../utils/httpError");

async function getWishlist(req, res) {
  const items = await prisma.wishlistItem.findMany({
    where: { userId: req.user.id },
    include: {
      listing: {
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              department: true,
            },
          },
          category: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({
    success: true,
    data: items,
  });
}

async function addToWishlist(req, res) {
  const { listingId } = req.body;

  if (!listingId) {
    throw new HttpError(400, "Listing ID is required");
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      sellerId: true,
      status: true,
    },
  });

  if (!listing || listing.status !== "AVAILABLE") {
    throw new HttpError(404, "Product is not available");
  }

  if (listing.sellerId === req.user.id) {
    throw new HttpError(
      400,
      "You cannot add your own listing to wishlist"
    );
  }

  const item = await prisma.wishlistItem.upsert({
    where: {
      userId_listingId: {
        userId: req.user.id,
        listingId,
      },
    },
    update: {},
    create: {
      userId: req.user.id,
      listingId,
    },
    include: {
      listing: true,
    },
  });

  res.status(201).json({
    success: true,
    message: "Product added to wishlist",
    data: item,
  });
}

async function removeFromWishlist(req, res) {
  const { id } = req.params;

  const result = await prisma.wishlistItem.deleteMany({
    where: {
      id,
      userId: req.user.id,
    },
  });

  if (result.count === 0) {
    throw new HttpError(404, "Wishlist item not found");
  }

  res.json({
    success: true,
    message: "Product removed from wishlist",
  });
}

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
