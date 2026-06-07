import { Request, Response, NextFunction } from "express";

const stripHtml = (value: string): string =>
  value.replace(/<[^>]*>/g, "").trim();

const sanitizeValue = (value: unknown): unknown => {
  if (typeof value === "string") return stripHtml(value);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, sanitizeValue(v)])
    );
  }
  return value;
};

const TEXT_FIELDS = new Set([
  "caption", "bio", "fullName", "username", "location",
  "text", "message", "content", "name", "comment",
]);

export const sanitizeInput = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (req.body) {
    for (const key of Object.keys(req.body)) {
      if (TEXT_FIELDS.has(key) && typeof req.body[key] === "string") {
        req.body[key] = stripHtml(req.body[key]);
      }
    }
  }
  if (req.query) {
    for (const key of Object.keys(req.query)) {
      if (TEXT_FIELDS.has(key) && typeof req.query[key] === "string") {
        req.query[key] = stripHtml(req.query[key] as string);
      }
    }
  }
  next();
};
