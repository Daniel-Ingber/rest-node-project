import { type Request, type RequestHandler } from "express";
import { HttpError } from "../error/custom-error.ts";
import authService from "../services/auth-service.ts";
import { UserModel } from "../database/models.ts";

const extractToken = (req: Request) => {
  const authToken = req.header("Authorization");

  if (
    authToken &&
    authToken.length > 7 &&
    authToken.toLocaleLowerCase().startsWith("bearer ")
  ) {
    return authToken.substring(7);
  }
  throw new HttpError(
    "Authorization header is missing or token is broken",
    400,
  );
};

const validateToken: RequestHandler = async (req, res, next) => {
  const token = extractToken(req);
  const { _id } = await authService.verfiyJWT(token);
  const user = await UserModel.findById(_id);
  if (!user) {
    throw new HttpError("User does not exist", 401);
  }

  req.user = user;
  next();
};

export default validateToken;
