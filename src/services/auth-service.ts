import bcrypt from "bcrypt";
import { SignJWT, type JWTPayload, jwtVerify } from "jose";
import env from "../config/index.ts";

const authService = {
  hashPassword: (plainPassword: string, rounds: number = 12) => {
    return bcrypt.hash(plainPassword, rounds);
  },

  validatePassword: (plainPassword: string, hashed: string) => {
    return bcrypt.compare(plainPassword, hashed);
  },

  generateJWT: (payload: JWTPayload) => {
    return new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("2h")
      .setIssuedAt()
      .sign(new TextEncoder().encode(env.JWT_SECRET));
  },

  verfiyJWT: (token: string) => {
    const secretKeyInput = new TextEncoder().encode(env.JWT_SECRET);
    const payload = jwtVerify(token, secretKeyInput);

    return payload.then((result) => result.payload);
  },
};

export default authService;
