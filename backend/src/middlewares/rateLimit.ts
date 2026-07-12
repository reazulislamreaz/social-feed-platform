import rateLimit from "express-rate-limit";

/** Login / register — slow down credential stuffing */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many auth attempts. Try again in a few minutes.",
    code: "RATE_LIMITED",
  },
});

/** Creating posts / comments / replies */
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "You are posting too quickly. Slow down a bit.",
    code: "RATE_LIMITED",
  },
});

/** Like / unlike taps */
export const likeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many reactions. Please wait a moment.",
    code: "RATE_LIMITED",
  },
});
