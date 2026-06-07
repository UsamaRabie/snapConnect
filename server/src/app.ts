import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import compression from "compression";
import { config } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { sanitizeInput } from "./middleware/sanitize";
import { ApiError } from "./utils/apiError";
import routes from "./routes";

const app = express();

app.use(compression());

const corsOrigins = config.corsOrigin.split(",").map((o) => o.trim());
const wsOrigins = corsOrigins
  .filter((o) => o.startsWith("http"))
  .map((o) => o.replace(/^http/, "ws"));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: config.nodeEnv === "production" ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://ui-avatars.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", ...corsOrigins, ...wsOrigins],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  } : false,
}));

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Set-Cookie"],
}));

app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use("/api", sanitizeInput);

if (config.nodeEnv === "production") {
  app.set("trust proxy", 1);
}

const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: { status: "error", message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.ip || "unknown";
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { status: "error", message: "Too many auth attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", limiter);
app.use("/api/v1/auth", authLimiter);
app.use("/api/v1", routes);

app.get("/api/v1/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "SnapConnect API is running",
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

app.all("*", (req: Request, _res: Response, next: NextFunction) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

app.use(errorHandler);

export default app;
