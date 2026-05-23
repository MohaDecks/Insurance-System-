export function errorHandler(err, req, res, next) {
  if (err.message && /Only JPG|PNG|WebP|PDF/i.test(err.message)) {
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err.name === "MulterError") {
    const msg =
      err.code === "LIMIT_FILE_SIZE" ? "File too large (max 8 MB)" : err.message || "Upload error";
    return res.status(400).json({ success: false, message: msg });
  }
  if (/JWT_SECRET|secretOrPrivateKey/i.test(err.message || "")) {
    return res.status(503).json({
      success: false,
      message:
        "Server is missing JWT_SECRET. Add it to server/.env on the API host, then restart the API.",
    });
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
