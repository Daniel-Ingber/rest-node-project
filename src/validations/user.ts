import { z } from "zod/v4";
import { addressSchema } from "./address.ts";
import { nameSchema } from "./name.ts";
import { passwordRegex, phoneRegex } from "./patterns.ts";
import { imageSchema } from "./image.ts";

export const userSchema = z.strictObject({
  address: addressSchema,
  email: z.email().min(5).max(250),
  name: nameSchema,
  password: z.string().min(6).max(30).regex(passwordRegex),
  phone: z.string().min(8).max(12).regex(phoneRegex),
  image: imageSchema,
  isBusiness: z.boolean(),
});

/** PUT /users/{id} - the client sends the whole user again,
 * but the password is changed only by the user itself on registration,
 * and isAdmin is never given by the client (only by the initial data)
 * */
export const userUpdateSchema = userSchema.omit({ password: true });

export type User = z.infer<typeof userSchema>;
