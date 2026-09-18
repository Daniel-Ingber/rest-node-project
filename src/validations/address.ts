import { z } from "zod/v4";

export const addressSchema = z.object({
  city: z.string().min(2).max(50),
  country: z.string().min(2).max(50),
  houseNumber: z.number().int().min(1).max(9999),
  street: z.string().min(2).max(50),
  zip: z.string().min(3).max(10),
  state: z.string().max(50).nullish().or(z.literal("")),
});

export type Address = z.infer<typeof addressSchema>;
