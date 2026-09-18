import { type RequestHandler } from "express";
import { type ZodType } from "zod/v4";
import { userSchema, userUpdateSchema } from "../validations/user.ts";
import { loginSchema } from "../validations/login.ts";
import { cardSchema } from "../validations/card.ts";
import { bizNumberSchema } from "../validations/biz-number.ts";

// Generic validator middlware for client-schema
export function validateSchema<T>(
  schema: ZodType<T>,
): RequestHandler<any, any, T> {
  return async (req, res, next) => {
    req.body = await schema.parseAsync(req.body);
    next();
  };
}

export const validateUser = validateSchema(userSchema);
export const validateLogin = validateSchema(loginSchema);
export const validateUserUpdate = validateSchema(userUpdateSchema);
export const validateCard = validateSchema(cardSchema);
export const validateBizNumber = validateSchema(bizNumberSchema);
