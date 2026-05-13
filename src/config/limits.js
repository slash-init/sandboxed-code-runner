import rateLimit from "express-rate-limit";

export const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  limit: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many requests. Try again later."
    });
  }
});
