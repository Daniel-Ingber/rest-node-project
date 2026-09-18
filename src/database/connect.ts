import env from "../config/index.ts";
import mongoose from "mongoose";
import initDB from "./init-db.ts";
import { logger } from "../logs/logger.ts";

const connectDB = async (
  connectionString: string = env.DB_CONNECTION_STRING,
) => {
  try {
    // connect to the DB
    await mongoose.connect(connectionString);
    logger.info("Connected to DB!")
    // Initilize Mock Data
    await initDB();
  } catch (error) {
    logger.error(`Failed to connect to DB: ${error}`);
    process.exit(1);
  }
};

export default connectDB;
