import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { ApiError } from "../utils/apiError";

const ALLOWED_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".gif", ".webp",
  ".mp4", ".mov",
]);

const MAGIC_BYTES: Record<string, Uint8Array[]> = {
  "image/jpeg": [new Uint8Array([0xFF, 0xD8, 0xFF])],
  "image/png": [new Uint8Array([0x89, 0x50, 0x4E, 0x47])],
  "image/gif": [new Uint8Array([0x47, 0x49, 0x46])],
  "image/webp": [new Uint8Array([0x52, 0x49, 0x46, 0x46])],
  "video/mp4": [new Uint8Array([0x00, 0x00, 0x00]), new Uint8Array([0x66, 0x74, 0x79, 0x70])],
};

const storage = multer.diskStorage({
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_MIMES.has(file.mimetype)) {
    return cb(new ApiError(400, `Invalid MIME type: ${file.mimetype}. Only images and videos are allowed.`));
  }

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new ApiError(400, `Invalid file extension: ${ext}. Only images and videos are allowed.`));
  }

  cb(null, true);
};

export const validateFileMagicBytes = async (filePath: string): Promise<void> => {
  const handle = await fs.open(filePath, "r");
  try {
    const buffer = new Uint8Array(12);
    await handle.read(buffer, 0, 12, 0);
    const hex = Buffer.from(buffer).toString("hex").toUpperCase();
    const isJPEG = hex.startsWith("FFD8FF");
    const isPNG = hex.startsWith("89504E47");
    const isGIF = hex.startsWith("474946");
    const isWEBP = hex.startsWith("52494646");

    if (!isJPEG && !isPNG && !isGIF && !isWEBP) {
      throw new ApiError(400, "File content does not match allowed image types. Upload rejected.");
    }
  } finally {
    await handle.close();
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});
