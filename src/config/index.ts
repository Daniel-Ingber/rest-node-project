import z from "zod/v4";
import { logger } from "../logs/logger.ts";

const envSchema = z.object({
  DB_CONNECTION_STRING: z.string().min(1, "DB_CONNECTION_STRING Is Required"),
  PORT: z.coerce.number().int().min(10).max(65535),
  CLIENT_URL: z.url("CLIENT_URL must contain valid URL"),
  NODE_ENV: z.enum(["production", "test", "development", "DEFUALT"]),
  LOG_LEVEL: z.enum(["fatal", "error", "info", "debug"]).default("info"),
  APP_NAME: z.string().min(1),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
});

const result = envSchema.safeParse(process.env);

if (result.error) {
  logger.error("Error in .env file");
  result.error.issues.forEach((iss) => {
    logger.error(`Error in field ${iss.path}, problem/issue: ${iss.code}`);
  });

  process.exit(1);
}

export default result.data;
