import corsMiddleware, { type CorsOptions } from "cors";
import { HttpError } from "../error/custom-error.ts";

const allowedOrigins = [
  "https://exmple.com",
  "http://localhost:5137",
  // ...
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
