import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const firstError = result.error.errors[0];
      res.status(400).json({
        error: firstError?.message || "Invalid request body",
        field: firstError?.path?.join("."),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

export const schemas = {
  login: z.object({
    username: z.string().min(1).max(100).trim(),
    password: z.string().min(1).max(200),
  }),

  kaSearch: z.object({
    kb_id: z.string().uuid(),
    query: z.string().min(1).max(2000).trim(),
    topK: z.number().int().min(1).max(10).optional().default(5),
  }),

  kaGaps: z.object({
    kb_id: z.string().uuid(),
    tickets: z.string().min(10).max(50000).trim(),
  }),

  kaFaq: z.object({
    kb_id: z.string().uuid(),
    audience: z.string().min(1).max(500).trim(),
    additionalContext: z.string().max(2000).optional().default(""),
  }),

  kaOnboardingCreate: z.object({
    kb_id: z.string().uuid().nullable().optional(),
    role: z.string().min(1).max(200).trim(),
    title: z.string().max(300).optional(),
  }),

  kaOnboardingChat: z.object({
    message: z.string().min(1).max(10000).trim(),
  }),

  kaKbCreate: z.object({
    name: z.string().min(1).max(300).trim(),
    description: z.string().max(1000).optional().default(""),
  }),

  promptCreate: z.object({
    title: z.string().min(1).max(300).trim(),
    category: z.string().min(1).max(100).trim().default("Custom"),
    description: z.string().max(1000).optional().default(""),
    prompt: z.string().min(1).max(50000).trim(),
    variables: z.array(z.string().max(100)).max(20).optional().default([]),
    tags: z.array(z.string().max(50)).max(20).optional().default([]),
  }),

  docscopeAnalyze: z.object({
    content: z.string().min(10).max(100000).trim(),
    mode: z.enum(["full", "gaps", "inconsistencies", "structure"]).optional().default("full"),
  }),

  seoscopeAnalyze: z.object({
    content: z.string().max(50000).optional().default(""),
    url: z.string().url().max(2000).optional().or(z.literal("")).optional(),
    targetKeywords: z.string().max(500).optional().default(""),
    analysisType: z.enum(["full", "keywords", "content", "technical"]).optional().default("full"),
  }).refine((d) => (d.content && d.content.length > 0) || (d.url && d.url.length > 0), {
    message: "Either content or url must be provided",
  }),

  chatMessage: z.object({
    message: z.string().min(1).max(4000).trim(),
    sessionId: z.string().max(100).optional(),
    visitorName: z.string().max(200).optional(),
    visitorEmail: z.string().email().optional().or(z.literal("")),
  }),
};
