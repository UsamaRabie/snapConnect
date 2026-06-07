import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ApiError } from "../utils/apiError";

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.body = parsed.body;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        next(new ApiError(400, message));
      } else {
        next(error);
      }
    }
  };
};
