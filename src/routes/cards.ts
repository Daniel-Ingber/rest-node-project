import { Router } from "express";
import { validateBizNumber, validateCard } from "../middleware/validate.ts";
import { isBusiness } from "../middleware/is-business.ts";
import { isAdmin } from "../middleware/is-admin.ts";
import {
  isCardOwner,
  isCardOwnerOrAdmin,
} from "../middleware/is-card-owner.ts";
import cardService from "../services/card-service.ts";
import validateToken from "../middleware/validate-token.ts";

const router = Router();

// POST http://localhost:3000/api/v1/cards
router.post("/", ...isBusiness, validateCard, async (req, res) => {
  const userId = req.user?._id.toString() as string;
  const cardData = req.body;

  const card = await cardService.createCard(cardData, userId);

  res.status(201).json({ card });
});

// GET http://localhost:3000/api/v1/cards
router.get("/", async (req, res) => {
  const cards = await cardService.getCards();

  res.json({ cards });
});

// GET http://localhost:3000/api/v1/cards/my-cards
router.get("/my-cards", validateToken, async (req, res) => {
  const userId = req.user?._id.toString() as string;

  const myCards = await cardService.getMyCards(userId);

  res.json({ myCards });
});

// GET http://localhost:3000/api/v1/cards/{id}
router.get("/:id", async (req, res) => {
  const card = await cardService.getCard(req.params.id as string);

  res.json({ card });
});

// PUT http://localhost:3000/api/v1/cards/{id}
router.put("/:id", ...isCardOwner, validateCard, async (req, res) => {
  const card = await cardService.updateCard(req.params.id as string, req.body);

  res.json({ card });
});

// PATCH http://localhost:3000/api/v1/cards/{id}
router.patch("/:id", validateToken, async (req, res) => {
  const userId = req.user?._id.toString() as string;

  const card = await cardService.toggleLike(req.params.id as string, userId);

  res.json({ card });
});

// PATCH http://localhost:3000/api/v1/cards/{id}/biz-number
router.patch(
  "/:id/biz-number",
  ...isAdmin,
  validateBizNumber,
  async (req, res) => {
    const card = await cardService.changeBizNumber(
      req.params.id as string,
      req.body.bizNumber,
    );

    res.json({ card });
  },
);

// DELETE http://localhost:3000/api/v1/cards/{id}
router.delete("/:id", ...isCardOwnerOrAdmin, async (req, res) => {
  const card = await cardService.deleteCard(req.params.id as string);

  res.json({ card });
});

export default router;
