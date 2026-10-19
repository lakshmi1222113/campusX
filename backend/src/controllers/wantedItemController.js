
const prisma = require("../config/prisma");
const HttpError = require("../utils/httpError");

async function getWantedItems(req, res) {
  const isMine = req.query.mine === "true";

  if (isMine && !req.user) {
    throw new HttpError(401, "Please log in to view your wanted items");
  }

  const items = await prisma.wantedItem.findMany({
    where: isMine ? { userId: req.user.id } : {},
    include: {
      user: {
        select: {
          id: true,
          name: true,
          department: true,
          year: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({
    success: true,
    count: items.length,
    data: items,
  });
}

async function createWantedItem(req, res) {
  const { title, description, maxPrice } = req.body;

  if (!title || !String(title).trim()) {
    throw new HttpError(400, "Title is required");
  }

  let amount;

  if (maxPrice !== undefined && maxPrice !== null && maxPrice !== "") {
    amount = Number(maxPrice);

    if (!Number.isFinite(amount) || amount < 0) {
      throw new HttpError(400, "maxPrice must be a valid non-negative number");
    }
  }

  const item = await prisma.wantedItem.create({
    data: {
      title: String(title).trim(),
      description: description || null,
      maxPrice: amount,
      userId: req.user.id,
    },
  });

  res.status(201).json({ success: true, data: item });
}

async function updateWantedItem(req, res) {
  const { title, description, maxPrice } = req.body;

  const existingItem = await prisma.wantedItem.findUnique({
    where: { id: req.params.id },
  });

  if (!existingItem) {
    throw new HttpError(404, "Wanted item not found");
  }

  if (existingItem.userId !== req.user.id && req.user.role !== "ADMIN") {
    throw new HttpError(403, "You can update only your own wanted items");
  }

  const data = {};

  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim()) {
      throw new HttpError(400, "Title cannot be empty");
    }
    data.title = title.trim();
  }

  if (description !== undefined) {
    data.description = description || null;
  }

  if (maxPrice !== undefined) {
    if (maxPrice === null || maxPrice === "") {
      data.maxPrice = null;
    } else {
      const amount = Number(maxPrice);

      if (!Number.isFinite(amount) || amount < 0) {
        throw new HttpError(400, "maxPrice must be a valid non-negative number");
      }
      data.maxPrice = amount;
    }
  }

  const updatedItem = await prisma.wantedItem.update({
    where: { id: existingItem.id },
    data,
  });

  res.json({
    success: true,
    message: "Wanted item updated successfully",
    data: updatedItem,
  });
}

async function deleteWantedItem(req, res) {
  const item = await prisma.wantedItem.findUnique({
    where: { id: req.params.id },
  });

  if (!item) {
    throw new HttpError(404, "Wanted item not found");
  }

  if (item.userId !== req.user.id && req.user.role !== "ADMIN") {
    throw new HttpError(403, "You can delete only your own wanted items");
  }

  await prisma.wantedItem.delete({
    where: { id: item.id },
  });

  res.json({
    success: true,
    message: "Wanted item deleted",
  });
}

module.exports = {
  getWantedItems,
  createWantedItem,
  updateWantedItem,
  deleteWantedItem,
};
