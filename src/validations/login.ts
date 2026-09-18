import { userSchema } from "./user.ts";

export const loginSchema = userSchema.pick({
  email: true,
  password: true,
});
