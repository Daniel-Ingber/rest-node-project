import { z } from "zod/v4";

export const nameSchema = z.object({
  first: z.string().min(2).max(20),
  middle: z.string().max(20).nullish().or(z.literal("")),
  last: z.string().min(2).max(20),
});

export type Name = z.infer<typeof nameSchema>;
