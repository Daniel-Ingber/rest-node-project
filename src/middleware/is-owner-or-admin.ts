import { type RequestHandler } from "express";
import validateToken from "./validate-token.ts";
import { HttpError } from "../error/custom-error.ts";

const isOwnerOrAdminHandler: RequestHandler = (req, res, next) => {
  // Owner Check
  if (req.user?._id.toString() === req.params.id) {
    return next();
  }
  // Admin Check
  const isAdmin = req.user?.isAdmin;
  if (isAdmin) {
    return next();
  }

  next(new HttpError("Must be admin or owner", 403));
};

export const isOwnerOrAdmin = [validateToken, isOwnerOrAdminHandler];
