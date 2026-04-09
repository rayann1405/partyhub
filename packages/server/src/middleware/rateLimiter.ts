import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "TOO_MANY_REQUESTS", message: "Trop de tentatives, réessayez dans 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const voteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "TOO_MANY_REQUESTS", message: "Trop de votes, réessayez dans 1 minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
