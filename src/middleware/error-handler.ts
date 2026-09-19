import { type ErrorRequestHandler } from "express";
import { MongoServerError } from "mongodb";
import mongoose from "mongoose";
import { ZodError } from "zod/v4";
import env from "../config/index.ts";
import { logger } from "./logger.ts";

const validationErrorNames = [
  "JOSEError",
  "JOSENotSupported",
  "JWEDecryptionFailed",
  "JWEInvalid",
  "JWEKeyManagementFailed",
  "JWEMultiError",
  "JWKInvalid",
  "JWKSInvalid",
  "JWKSMultipleMatchingKeys",
  "JWKSNoMatchingKey",
  "JWKSTimeout",
  "JWSInvalid",
  "JWSSignatureVerificationFailed",
  "JWTClaimValidationFailed",
  "JWTExpired",
  "JWTInvalid",
];

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  logger.error(err);

  if (err.name && validationErrorNames.includes(err.name)) {
    return res.status(400).json({ name: err.name });
  }

  // Error handler for broken json data
  if (err instanceof SyntaxError) {
    return res.status(400).json({
      error: err.name,
      message: "Invalid JSON Format",
      description: err.message,
    });
  }

  // Error handler for client validation
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation Error",
      issues: err.issues,
    });
  }

  // Error handler for an id that is not a valid mongo id
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      message: `The value "${err.value}" is not a valid ${err.path}`,
      name: err.name,
    });
  }

  // Error handler for the rules of the mongoose schemas
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      message: "Validation Error",
      issues: Object.values(err.errors).map((issue) => issue.message),
    });
  }

  // Error handler for DB operations
  if (err instanceof MongoServerError) {
    return res.status(400).json({
      messgae: err.errmsg,
      code: err.errorResponse?.code ?? "no-code",
      name: err.name,
      keyValue: err.keyValue,
      stack: env.LOG_LEVEL === "debug" ? err.stack : undefined,
    });
  }

  const status =
    err.statusCode ||
    err.status ||
    (res.statusCode >= 400 ? res.statusCode : 500);

  res.status(status).json({ message: err.message ?? "internal server error" });
};

export { errorHandler };
