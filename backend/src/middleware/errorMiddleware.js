const notFound = (req, _res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (error, _req, res, _next) => {
  console.error(error.message);

  if (error.code === "P2002") {
    return res.status(409).json({ success: false, message: "A record with this unique value already exists" });
  }
  if (error.code === "P2025") {
    return res.status(404).json({ success: false, message: "Record not found" });
  }

  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? "Internal server error" : error.message,
  });
};

module.exports = { notFound, errorHandler };
