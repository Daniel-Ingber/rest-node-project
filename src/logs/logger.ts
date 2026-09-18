import pino from "pino";

/** The level is read straight from the process, and not from the config,
 * because the config itself reports its own errors with this logger
 * */
export const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });
