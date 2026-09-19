import env from "../config/index.ts";
import { logger } from "../middleware/logger.ts";
import authService from "../services/auth-service.ts";
import cardService from "../services/card-service.ts";
import { InitialUsers } from "./initial-users.ts";
import { InitialCards } from "./initial-cards.ts";
import { CardModel, UserModel } from "./models.ts";

const initUsers = async () => {
  const usersCount = await UserModel.countDocuments();
  if (usersCount > 0) {
    return;
  }

  for (let user of InitialUsers) {
    user.password = await authService.hashPassword(user.password);
    const savedUser = await new UserModel(user).save();
    logger.trace(`saved user: ${savedUser}`);
  }
};

const initCards = async () => {
  const cardsCount = await CardModel.countDocuments();
  if (cardsCount > 0) {
    return;
  }

  // Every card belongs to the business user of the initial data
  const businessUser = await UserModel.findByEmail("user2@user2.com");
  if (!businessUser) {
    logger.warn("[initCards]: No business user to own the initial cards");
    return;
  }

  for (let card of InitialCards) {
    const savedCard = await cardService.createCard(
      card,
      businessUser._id.toString(),
    );
    logger.trace(`saved card: ${savedCard}`);
  }
};

const initDB = async () => {
  if (env.NODE_ENV !== "production") {
    logger.info("Intilizing Database...");

    await initUsers();
    await initCards();

    logger.info("Database initialized successfully");
  }
};

export default initDB;
