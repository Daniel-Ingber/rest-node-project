import path from "node:path";
import { EOL } from "node:os";
import { STATUS_CODES } from "node:http";
import { appendFile, mkdir } from "node:fs/promises";
import { type ErrorRequestHandler, type RequestHandler } from "express";
import { ZodError } from "zod/v4";
import { logger } from "../logs/logger.ts";

/** Bonus - every answer with a status code of 400 and above is written
 * into a file inside the logs folder, named after the date of that day
 * */
const LOGS_DIR = path.join(import.meta.dirname, "..", "..", "logs");
const FAILED_STATUS_CODE = 400;
const MAX_MESSAGE_LENGTH = 300;

/** Every failure is written on one line, so a long message is cut and a
 * validation error is written as the list of the fields that it failed on
 * */
const messageOf = (error: Error | undefined, status: number) => {
  if (error instanceof ZodError) {
    const fields = error.issues.map((issue) => issue.path.join(".") || "body");

    return `Validation Error on: ${fields.join(", ")}`;
  }

  // A request can fail without an error, for example an address that no route matched
  const message = error?.message ?? STATUS_CODES[status] ?? "Unknown";

  return message.replace(/\s+/g, " ").trim().slice(0, MAX_MESSAGE_LENGTH);
};

const logFileOf = (date: Date) => {
  const day = date.toISOString().slice(0, 10);

  return path.join(LOGS_DIR, `log-${day}.log`);
};

/** appendFile creates the file only when it is not there yet,
 * so the file of a day that was already written is never replaced
 * */
const writeFailure = async (date: Date, status: number, message: string) => {
  const entry = `${date.toISOString()} | ${status} | ${message}`;

  try {
    await mkdir(LOGS_DIR, { recursive: true });
    await appendFile(logFileOf(date), entry + EOL);
  } catch (error) {
    logger.error(`[fileLogger]: Could not write to the log file: ${error}`);
  }
};

/** The error handler is the one that answers the client, so the error
 * is kept on the response until the answer is finished and can be read
 * */
export const fileErrorLogger: ErrorRequestHandler = (err, req, res, next) => {
  res.locals.error = err;
  next(err);
};

export const fileLogger: RequestHandler = (req, res, next) => {
  const requestDate = new Date();

  res.on("finish", () => {
    if (res.statusCode < FAILED_STATUS_CODE) {
      return;
    }

    const error = res.locals.error as Error | undefined;

    writeFailure(requestDate, res.statusCode, messageOf(error, res.statusCode));
  });

  next();
};
