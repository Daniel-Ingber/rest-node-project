import { type Card as CardRequest } from "../validations/card.ts";
import { CardModel } from "../database/models.ts";
import { logger } from "../middleware/logger.ts";
import { HttpError, NotFoundError } from "../error/custom-error.ts";

/** Every business number in the application is a 7 digits number */
const MIN_BIZ_NUMBER = 1_000_000;
const MAX_BIZ_NUMBER = 9_999_999;

// can be used with moduels like uuid() instead
const generateBizNumber = async () => {
  while (true) {
    const random =
      MIN_BIZ_NUMBER +
      Math.floor(Math.random() * (MAX_BIZ_NUMBER - MIN_BIZ_NUMBER + 1));
    const cardWithSameNumber = await CardModel.findOne({ bizNumber: random });

    if (!cardWithSameNumber) {
      return random;
    }
  }
};

const cardService = {
  getCards: async () => {
    const cards = await CardModel.find();

    logger.info("[getCards]: Return all cards");
    return cards;
  },
  getCard: async (cardId: string) => {
    const card = await CardModel.findById(cardId);
    if (!card) {
      logger.error("[getCard]: No such card found");
      throw new NotFoundError("No such card found");
    }

    logger.info("[getCard]: Return card succesfully");
    return card;
  },
  getMyCards: async (userId: string) => {
    const cards = await CardModel.find({ userId });

    logger.info("[getMyCards]: Return all the cards of the user");
    return cards;
  },
  createCard: async (cardData: CardRequest, userId: string) => {
    const card = new CardModel(cardData);

    card.userId = userId;
    card.bizNumber = await generateBizNumber();

    const savedCard = await card.save();
    logger.info("[createCard]: Create card succesfully - Return card");
    return savedCard;
  },
  updateCard: async (cardId: string, cardData: CardRequest) => {
    const card = await CardModel.findByIdAndUpdate(cardId, cardData, {
      new: true,
    });

    if (!card) {
      logger.error("[updateCard]: No such card found");
      throw new NotFoundError("No such card found");
    }

    logger.info("[updateCard]: Update card succesfully - Return card");
    return card;
  },
  deleteCard: async (cardId: string) => {
    const card = await CardModel.findByIdAndDelete(cardId);
    if (!card) {
      logger.error("[deleteCard]: No such card found");
      throw new NotFoundError("No such card found");
    }

    logger.info("[deleteCard]: Delete card succesfully - Return card");
    return card;
  },
  /** A second call of the same user removes his like from the card */
  toggleLike: async (cardId: string, userId: string) => {
    const card = await cardService.getCard(cardId);

    const isLiked = card.likes.includes(userId);
    card.likes = isLiked
      ? card.likes.filter((likedBy) => likedBy !== userId)
      : [...card.likes, userId];

    const savedCard = await card.save();
    logger.info(`[toggleLike]: The card is now ${isLiked ? "un" : ""}liked`);
    return savedCard;
  },

  // Bonus #1
  changeBizNumber: async (cardId: string, bizNumber: number) => {
    const cardWithSameNumber = await CardModel.findOne({ bizNumber });
    if (cardWithSameNumber) {
      logger.error("[changeBizNumber]: The business number is aleardy taken");
      throw new HttpError("The business number is aleardy taken", 400);
    }

    const card = await CardModel.findByIdAndUpdate(
      cardId,
      { bizNumber },
      { new: true },
    );

    if (!card) {
      logger.error("[changeBizNumber]: No such card found");
      throw new NotFoundError("No such card found");
    }

    logger.info("[changeBizNumber]: Change business number - Return card");
    return card;
  },
};

export default cardService;
