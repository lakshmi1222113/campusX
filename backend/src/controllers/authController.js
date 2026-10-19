
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const HttpError = require("../utils/httpError");

function makeToken(userId) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from .env");
  }

  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function publicUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

// Normalize Indian mobile numbers to +91XXXXXXXXXX.
function normalizePhoneNumber(phoneNumber) {
  if (typeof phoneNumber !== "string") {
    throw new HttpError(400, "Phone number must be text");
  }

  const cleaned = phoneNumber.trim().replace(/[\s()-]/g, "");

  if (!cleaned) {
    return null;
  }

  if (!/^(?:\+91)?[6-9]\d{9}$/.test(cleaned)) {
    throw new HttpError(
      400,
      "Enter a valid 10-digit Indian mobile number"
    );
  }

  return cleaned.startsWith("+91")
    ? cleaned
    : `+91${cleaned}`;
}

// Register a new student.
async function register(req, res) {
  const {
    name,
    email,
    password,
    department,
    year,
    college,
    phoneNumber,
  } = req.body;

  if (!name || !email || !password) {
    throw new HttpError(
      400,
      "Name, email, and password are required"
    );
  }

  if (typeof name !== "string" || !name.trim()) {
    throw new HttpError(400, "Enter a valid name");
  }

  if (name.trim().length > 100) {
    throw new HttpError(
      400,
      "Name must be 100 characters or fewer"
    );
  }

  if (
    typeof password !== "string" ||
    password.length < 8
  ) {
    throw new HttpError(
      400,
      "Password must be at least 8 characters"
    );
  }

  if (
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    throw new HttpError(400, "Enter a valid email address");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const exists = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (exists) {
    throw new HttpError(
      409,
      "An account with this email already exists"
    );
  }

  const normalizedPhone =
    phoneNumber == null
      ? null
      : normalizePhoneNumber(phoneNumber);

  let parsedYear = null;

  if (year != null && year !== "") {
    parsedYear = Number(year);

    if (
      !Number.isInteger(parsedYear) ||
      parsedYear < 1 ||
      parsedYear > 4
    ) {
      throw new HttpError(
        400,
        "Study year must be between 1 and 4"
      );
    }
  }

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 12),
      phoneNumber: normalizedPhone,
      department:
        typeof department === "string" && department.trim()
          ? department.trim()
          : null,
      year: parsedYear,
      college:
        typeof college === "string" && college.trim()
          ? college.trim()
          : null,
    },
  });

  res.status(201).json({
    success: true,
    message: "Registration successful",
    token: makeToken(user.id),
    data: publicUser(user),
  });
}

// Log in an existing student.
async function login(req, res) {
  const { email, password } = req.body;

  if (
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    !password
  ) {
    throw new HttpError(
      400,
      "Email and password are required"
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      email: email.trim().toLowerCase(),
    },
  });

  if (
    !user ||
    !(await bcrypt.compare(password, user.passwordHash))
  ) {
    throw new HttpError(401, "Invalid email or password");
  }

  res.json({
    success: true,
    message: "Login successful",
    token: makeToken(user.id),
    data: publicUser(user),
  });
}

// Return the authenticated user's profile.
async function getMe(req, res) {
  res.json({
    success: true,
    data: req.user,
  });
}

// Update the logged-in user's profile.
async function updateProfile(req, res) {
  const {
    name,
    department,
    year,
    college,
    phoneNumber,
  } = req.body;

  const data = {};

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      throw new HttpError(400, "Name cannot be empty");
    }

    if (name.trim().length > 100) {
      throw new HttpError(
        400,
        "Name must be 100 characters or fewer"
      );
    }

    data.name = name.trim();
  }

  if (department !== undefined) {
    if (
      department !== null &&
      typeof department !== "string"
    ) {
      throw new HttpError(400, "Department must be text");
    }

    data.department =
      typeof department === "string" && department.trim()
        ? department.trim()
        : null;
  }

  if (college !== undefined) {
    if (
      college !== null &&
      typeof college !== "string"
    ) {
      throw new HttpError(400, "College must be text");
    }

    data.college =
      typeof college === "string" && college.trim()
        ? college.trim()
        : null;
  }

  if (phoneNumber !== undefined) {
    if (
      phoneNumber !== null &&
      typeof phoneNumber !== "string"
    ) {
      throw new HttpError(
        400,
        "Phone number must be text"
      );
    }

    data.phoneNumber =
      phoneNumber === null
        ? null
        : normalizePhoneNumber(phoneNumber);
  }

  if (year !== undefined) {
    if (year === null || year === "") {
      data.year = null;
    } else {
      const parsedYear = Number(year);

      if (
        !Number.isInteger(parsedYear) ||
        parsedYear < 1 ||
        parsedYear > 4
      ) {
        throw new HttpError(
          400,
          "Study year must be between 1 and 4"
        );
      }

      data.year = parsedYear;
    }
  }

  if (Object.keys(data).length === 0) {
    throw new HttpError(
      400,
      "Provide at least one field to update"
    );
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data,
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
      updatedAt: true,
    },
  });

  res.json({
    success: true,
    message: "Profile updated successfully",
    data: user,
  });
}

// Change the logged-in user's password.
async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    !currentPassword ||
    !newPassword
  ) {
    throw new HttpError(
      400,
      "Current password and new password are required"
    );
  }

  if (newPassword.length < 8) {
    throw new HttpError(
      400,
      "New password must be at least 8 characters"
    );
  }

  if (currentPassword === newPassword) {
    throw new HttpError(
      400,
      "New password must differ from your current password"
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!user) {
    throw new HttpError(404, "User account not found");
  }

  const matches = await bcrypt.compare(
    currentPassword,
    user.passwordHash
  );

  if (!matches) {
    throw new HttpError(
      400,
      "Current password is incorrect"
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  res.json({
    success: true,
    message: "Password changed successfully",
  });
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
};
