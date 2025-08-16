import { z } from "zod";
import { logger } from "./logger";

// Environment validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  REPL_ID: z.string().optional(),
  REPLIT_DOMAINS: z.string().optional(),
  DEFAULT_OBJECT_STORAGE_BUCKET_ID: z.string().optional(),
  PORT: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 5000)),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnvironment(): EnvConfig {
  try {
    const validated = envSchema.parse(process.env);
    logger.info("Environment validation successful");
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error("Environment validation failed:", {
        errors: error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
          code: err.code,
        })),
      });

      logger.error("❌ Environment validation failed:");
      error.errors.forEach((err) => {
        logger.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

// Request validation helpers
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    try {
      req.validatedBody = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validation error",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}

// Common validation schemas
export const commonSchemas = {
  id: z.string().uuid("Invalid ID format"),
  email: z.string().email("Invalid email format"),
  url: z.string().url("Invalid URL format"),
  positiveInt: z.number().int().positive("Must be a positive integer"),
  nonEmptyString: z.string().trim().min(1, "Cannot be empty"),
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
  }),
};

// Sanitization helpers
export function sanitizeString(input: string, maxLength = 1000): string {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=\s*"[^"]*"/gi, "")
    .slice(0, maxLength);
}

export function sanitizeEmail(input: string): string {
  return sanitizeString(input).toLowerCase();
}

export function sanitizeFilename(input: string): string {
  return sanitizeString(input)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 255);
}

export function sanitizeInput(input: any): any {
  if (typeof input === "string") {
    return sanitizeString(input);
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }

  if (input && typeof input === "object") {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }

  return input;
}

function coerceNumbers(input: any): any {
  if (typeof input === "string" && input.trim() !== "" && !isNaN(Number(input))) {
    return Number(input);
  }
  if (Array.isArray(input)) {
    return input.map(coerceNumbers);
  }
  if (input && typeof input === "object") {
    const result: any = {};
    for (const [key, value] of Object.entries(input)) {
      result[key] = coerceNumbers(value);
    }
    return result;
  }
  return input;
}

// Validation middleware
export function validateSchema<T extends z.ZodTypeAny>(schema: T) {
  return (req: any, res: any, next: any) => {
    try {
      const data = coerceNumbers(sanitizeInput({ ...req.body, ...req.query }));
      req.validated = schema.parse(data);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.errors,
        });
      }
      next(error);
    }
  };
}

export const paginationSchema = z.object({
  page: z.preprocess(
    (v) => (v === undefined ? undefined : Number(v)),
    z.number().int().min(1).default(1)
  ),
  limit: z.preprocess(
    (v) => (v === undefined ? undefined : Number(v)),
    z.number().int().min(1).max(100).default(20)
  ),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const searchSchema = z.object({
  q: z.string().optional(),
  framework: z.enum(["ISO27001", "SOC2", "PCI-DSS"]).optional(),
  status: z.enum(["approved", "pending", "rejected"]).optional(),
});

// Rate limiting configuration
export const rateLimitConfig = {
  // General API rate limit
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
  },

  // Strict rate limit for AI endpoints
  ai: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 AI requests per minute
  },

  // Auth endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 auth requests per 15 minutes
  },

  // File upload endpoints
  upload: {
    windowMs: 60 * 1000, // 1 minute
    max: 20, // limit each IP to 20 uploads per minute
  },
};

// Database query validation
export function validateDatabaseQuery(query: string): boolean {
  const dangerousPatterns = [
    /drop\s+table/i,
    /delete\s+from.*where\s+1\s*=\s*1/i,
    /truncate/i,
    /alter\s+table/i,
    /create\s+table/i,
    /grant/i,
    /revoke/i,
  ];

  return !dangerousPatterns.some((pattern) => pattern.test(query));
}

// File upload validation
export const fileValidation = {
  allowedMimeTypes: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/json",
    "image/jpeg",
    "image/png",
    "image/webp",
  ],

  maxFileSize: 10 * 1024 * 1024, // 10MB

  validateFile(file: any): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: "No file provided" };
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      return { valid: false, error: "File type not allowed" };
    }

    if (file.size > this.maxFileSize) {
      return { valid: false, error: "File size exceeds limit" };
    }

    return { valid: true };
  },
};
