import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

function rateLimitHandler(_req: Request, res: Response) {
  res.status(429).json({
    error: "Too many requests — please wait before trying again.",
  });
}

export const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => req.path.startsWith("/api/webhooks"),
});

export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const aiToolLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const auditLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: "Too many login attempts — please wait 15 minutes before trying again.",
    });
  },
});

export const embeddingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
