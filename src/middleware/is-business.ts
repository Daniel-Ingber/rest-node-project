import { type RequestHandler } from "express";
import validateToken from "./validate-token.ts";
import { HttpError } from "../error/custom-error.ts";

const isBusinessHandler: RequestHandler = (req, res, next) => {
  const isBusinessOrAdmin = req.user?.isBusiness || req.user?.isAdmin;

  if (isBusinessOrAdmin) {
    return next();
  }

  next(new HttpError("Must be business user or admin", 403));
};

export const isBusiness = [validateToken, isBusinessHandler];
