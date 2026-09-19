import corsMiddleware, { type CorsOptions } from "cors";
import { HttpError } from "../error/custom-error.ts";
import env from "../config/index.ts";

const allowedOrigins = [
  env.CLIENT_URL,
  "http://localhost:5173",
  // Vite
];

const corsOptions: CorsOptions = {
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-With", "Accept"],
  credentials: true,
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new HttpError("Blocked By CORS"));
    }
  },
};

export const cors = corsMiddleware(corsOptions);
