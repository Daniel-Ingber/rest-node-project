import { Router } from "express";
import userService from "../services/user-service.ts";
import {
  validateLogin,
  validateUser,
  validateUserUpdate,
} from "../middleware/validate.ts";
import { isAdmin } from "../middleware/is-admin.ts";
import { isOwnerOrAdmin } from "../middleware/is-owner-or-admin.ts";

const router = Router();

// POST http://localhost:3000/api/v1/users/login
router.post("/login", validateLogin, async (req, res) => {
  const token = await userService.login(req.body.email, req.body.password);

  res.json({ message: "Logged in!", token });
});

// POST http://localhost:3000/api/v1/users
router.post("/", validateUser, async (req, res) => {
  const userResponse = await userService.createUser(req.body);

  res.status(201).json({ message: "User Saved!", user: userResponse });
});

// GET http://localhost:3000/api/v1/users
router.get("/", ...isAdmin, async (req, res) => {
  const users = await userService.getUsers();

  res.json({ users });
});

// GET http://localhost:3000/api/v1/users/{id}
router.get("/:id", ...isOwnerOrAdmin, async (req, res) => {
  const user = await userService.getUser(req.params.id as string);

  res.json({ user });
});

// PUT http://localhost:3000/api/v1/users/{id}
router.put("/:id", ...isOwnerOrAdmin, validateUserUpdate, async (req, res) => {
  const user = await userService.updateUser(req.params.id as string, req.body);

  res.json({ user });
});

// PATCH http://localhost:3000/api/v1/users/{id}
router.patch("/:id", ...isOwnerOrAdmin, async (req, res) => {
  const user = await userService.toggleBusinessStatus(req.params.id as string);

  res.json({ user });
});

// DELETE http://localhost:3000/api/v1/users/{id}
router.delete("/:id", ...isOwnerOrAdmin, async (req, res) => {
  const user = await userService.deleteUser(req.params.id as string);

  res.json({ user });
});

export default router;
