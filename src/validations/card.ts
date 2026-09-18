import { z } from "zod/v4";
import { addressSchema } from "./address.ts";
import { imageSchema } from "./image.ts";
import { phoneRegex } from "./patterns.ts";

export const cardSchema = z.object({
  title: z.string().min(2).max(100),
  subtitle: z.string().min(2).max(100),
  description: z.string().min(2).max(500),
  phone: z.string().min(2).max(50).regex(phoneRegex),
  email: z.email().min(5).max(255),
  web: z.url().min(5).max(255),
  address: addressSchema,
  image: imageSchema,
});

export type Card = z.infer<typeof cardSchema>;
