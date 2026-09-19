import env from "./config/index.ts";
import express from "express";
import morgan from "morgan";
import notFound from "./middleware/not-found.ts";
import usersRouter from "./routes/users.ts";
import cardsRouter from "./routes/cards.ts";
import connectDB from "./database/connect.ts";
import { errorHandler } from "./middleware/error-handler.ts";
import { fileErrorLogger, fileLogger } from "./middleware/file-logger.ts";
import { logger } from "./middleware/logger.ts";
import { cors } from "./middleware/cors.ts";

connectDB();

const app = express();

app.use(cors);

app.use(
  morgan("[:method]: :url , :status - :response-time ms", {
    stream: { write: (message) => logger.info(message.trim()) },
  }),
);

app.use(fileLogger);

app.use(express.json());

/** Routes */
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/cards", cardsRouter);
app.use(notFound);
app.use(fileErrorLogger);
app.use(errorHandler);

const { PORT } = env;

app.listen(PORT, () => {
  logger.info(`Server runs on: http://localhost:${PORT}`);
});
