import { z } from "zod/v4";

export const imageSchema = z.object({
  alt: z.string().max(100).nullish().or(z.literal("")),
  url: z.url().min(5).max(250),
});

export type Image = z.infer<typeof imageSchema>;
