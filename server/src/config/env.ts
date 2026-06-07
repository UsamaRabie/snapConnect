import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

interface EnvConfig {
  nodeEnv: string;
  port: number;
  mongodbUri: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtAccessExpiresIn: string;
  jwtRefreshExpiresIn: string;
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinaryApiSecret: string;
  corsOrigin: string;
  rateLimitWindowMs: number;
  rateLimitMax: number;
}

const getEnvVar = (key: string, fallback?: string): string => {
  const value = process.env[key] || fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const config: EnvConfig = {
  nodeEnv: getEnvVar("NODE_ENV", "development"),
  port: parseInt(getEnvVar("PORT", "5000"), 10),
  mongodbUri: getEnvVar("MONGODB_URI"),
  jwtAccessSecret: getEnvVar("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: getEnvVar("JWT_REFRESH_SECRET"),
  jwtAccessExpiresIn: getEnvVar("JWT_ACCESS_EXPIRES_IN", "15m"),
  jwtRefreshExpiresIn: getEnvVar("JWT_REFRESH_EXPIRES_IN", "7d"),
  cloudinaryCloudName: getEnvVar("CLOUDINARY_CLOUD_NAME", ""),
  cloudinaryApiKey: getEnvVar("CLOUDINARY_API_KEY", ""),
  cloudinaryApiSecret: getEnvVar("CLOUDINARY_API_SECRET", ""),
  corsOrigin: getEnvVar("CORS_ORIGIN", "http://localhost:3000"),
  rateLimitWindowMs: parseInt(getEnvVar("RATE_LIMIT_WINDOW_MS", "900000"), 10),
  rateLimitMax: parseInt(getEnvVar("RATE_LIMIT_MAX", "100"), 10),
};
