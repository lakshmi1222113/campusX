
const prisma = require("../config/prisma");
const HttpError = require("../utils/httpError");

async function getCart(req, res) {
  const items = await prisma.cartItem.findMany({
    where: { userId: req.user.id },
    include: {
      listing: {
        include: {
          seller: {
            select: { id: true, name: true, department: true },
          },
          category: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const availableItems = items
    .filter((item) => item.listing?.status === "AVAILABLE")
    .map((item) => ({
      ...item,
      quantity: 1,
    }));

  res.json({
    success: true,
    data: availableItems,
  });
}

async function addToCart(req, res) {
  const { listingId } = req.body;

  if (!listingId) {
    throw new HttpError(400, "Listing ID is required");
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, sellerId: true, status: true },
  });

  if (!listing || listing.status !== "AVAILABLE") {
    throw new HttpError(404, "Product is not available");
  }

  if (listing.sellerId === req.user.id) {
    throw new HttpError(400, "You cannot add your own listing to cart");
  }

  const item = await prisma.cartItem.upsert({
    where: {
      userId_listingId: {
        userId: req.user.id,
        listingId,
      },
    },
    update: { quantity: 1 },
    create: {
      userId: req.user.id,
      listingId,
      quantity: 1,
    },
    include: { listing: true },
  });

  res.status(201).json({
    success: true,
    message: "Product added to cart",
    data: {
      ...item,
      quantity: 1,
    },
  });
}

async function updateCartItem(req, res) {
  const { id } = req.params;

  const existing = await prisma.cartItem.findFirst({
    where: {
      id,
      userId: req.user.id,
    },
  });

  if (!existing) {
    throw new HttpError(404, "Cart item not found");
  }

  // Quantity is fixed at one.
  await prisma.cartItem.update({
    where: { id },
    data: { quantity: 1 },
  });

  const item = await prisma.cartItem.findUnique({
    where: { id },
    include: { listing: true },
  });

  res.json({
    success: true,
    message: "Each cart item is limited to one unit",
    data: {
      ...item,
      quantity: 1,
    },
  });
}

async function removeFromCart(req, res) {
  const { id } = req.params;

  const result = await prisma.cartItem.deleteMany({
    where: {
      id,
      userId: req.user.id,
    },
  });

  if (result.count === 0) {
    throw new HttpError(404, "Cart item not found");
  }

  res.json({
    success: true,
    message: "Product removed from cart",
  });
}

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
};
