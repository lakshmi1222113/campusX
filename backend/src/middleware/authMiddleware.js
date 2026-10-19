
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");

const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new HttpError(401, "Please log in to continue");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from .env");
  }

  let payload;

  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (_error) {
    throw new HttpError(401, "Invalid or expired token");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      year: true,
      college: true,
      phoneNumber: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new HttpError(401, "User account not found");
  }

  req.user = user;
  next();
});

// Allows guests to browse.
// Does not expose phone numbers in public Marketplace requests.
const optionalProtect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || "";

  if (!header.trim()) {
    return next();
  }

  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new HttpError(401, "Invalid authorization header");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from .env");
  }

  let payload;

  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (_error) {
    throw new HttpError(401, "Invalid or expired token");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      role: true,
      college: true,
    },
  });

  if (!user) {
    throw new HttpError(401, "User account not found");
  }

  req.user = user;
  next();
});

const adminOnly = (req, _res, next) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return next(
      new HttpError(403, "Administrator access required")
    );
  }

  next();
};

module.exports = {
  protect,
  optionalProtect,
  adminOnly,
};
