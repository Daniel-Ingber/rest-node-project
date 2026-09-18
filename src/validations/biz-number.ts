import { z } from "zod/v4";

/** PATCH /cards/{id}/biz-number - only the admin sends this object */
export const bizNumberSchema = z.strictObject({
  bizNumber: z.number().int().min(1_000_000).max(9_999_999),
});

export type BizNumber = z.infer<typeof bizNumberSchema>;
