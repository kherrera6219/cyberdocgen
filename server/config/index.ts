import dotenv from "dotenv";
dotenv.config();

const env = process.env.NODE_ENV || "development";

export const config = {
  env,
  isProduction: env === "production",
  isDevelopment: env === "development",
  isTest: env === "test",
  port: parseInt(process.env.PORT || "5000", 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  session: {
    secret: process.env.SESSION_SECRET || "default_secret",
  },
  cors: {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : ["http://localhost:5000"],
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  storage: {
    provider: "gcs", // Force Google Cloud Storage
    bucket: process.env.STORAGE_BUCKET,
    region: process.env.STORAGE_REGION,
  },
  ai: {
    openaiKey: process.env.OPENAI_API_KEY,
    anthropicKey: process.env.ANTHROPIC_API_KEY,
    googleKey: process.env.GOOGLE_GENERATIVE_AI_KEY || process.env.GEMINI_API_KEY,
  }
};
