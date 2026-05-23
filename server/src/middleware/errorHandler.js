export function errorHandler(err, req, res, next) {
  if (err.message && /Only JPG|PNG|WebP|PDF/i.test(err.message)) {
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err.name === "MulterError") {
    const msg =
      err.code === "LIMIT_FILE_SIZE" ? "File too large (max 8 MB)" : err.message || "Upload error";
    return res.status(400).json({ success: false, message: msg });
  }
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  if (process.env.NODE_ENV !== "production" && err.stack) {
    console.error(err.stack);
  } else {
    console.error(message);
  }
  res.status(status).json({ success: false, message });
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
