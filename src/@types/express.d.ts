import { type DBUser } from "../database/schemas/user.ts";

declare global {
  namespace Express {
    interface Request {
      user?: DBUser;
    }
  }
}
