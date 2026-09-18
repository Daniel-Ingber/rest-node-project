import { type RequestHandler } from "express";
import { HttpError } from "../error/custom-error.ts";
import validateToken from "./validate-token.ts";

const isAdminHandler: RequestHandler = (req, res, next) => {
  const isAdmin = req.user?.isAdmin;
  if (isAdmin) {
    return next();
  }
  next(new HttpError("Must be admin", 403));
};

export const isAdmin = [validateToken, isAdminHandler];
