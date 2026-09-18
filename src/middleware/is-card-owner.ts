import { type RequestHandler } from "express";
import validateToken from "./validate-token.ts";
import cardService from "../services/card-service.ts";
import { HttpError } from "../error/custom-error.ts";

/** Unlike the user routes, the owner of a card is known only after
 * the card itself is read from the database
 * */
const isCardOwnerOf = async (cardId: string, userId?: string) => {
  const card = await cardService.getCard(cardId);

  return card.userId === userId;
};

const isCardOwnerHandler: RequestHandler = async (req, res, next) => {
  // Owner Check
  const isOwner = await isCardOwnerOf(
    req.params.id as string,
    req.user?._id.toString(),
  );

  if (isOwner) {
    return next();
  }

  next(new HttpError("Must be the user who created the card", 403));
};

const isCardOwnerOrAdminHandler: RequestHandler = async (req, res, next) => {
  // Admin Check
  if (req.user?.isAdmin) {
    return next();
  }

  // Owner Check
  const isOwner = await isCardOwnerOf(
    req.params.id as string,
    req.user?._id.toString(),
  );

  if (isOwner) {
    return next();
  }

  next(new HttpError("Must be admin or the user who created the card", 403));
};

export const isCardOwner = [validateToken, isCardOwnerHandler];
export const isCardOwnerOrAdmin = [validateToken, isCardOwnerOrAdminHandler];
