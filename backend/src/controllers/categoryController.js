const prisma = require("../config/prisma");
const HttpError = require("../utils/httpError");

async function getCategories(_req, res) {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { listings: true } } },
  });
  res.json({ success: true, count: categories.length, data: categories });
}

async function createCategory(req, res) {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  if (!name) throw new HttpError(400, "Category name is required");
  const category = await prisma.category.create({ data: { name } });
  res.status(201).json({ success: true, data: category });
}

module.exports = { getCategories, createCategory };
