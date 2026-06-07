import mongoose from "mongoose";
import { config } from "./env";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

export const connectDB = async (retryCount = 0): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      w: "majority",
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected");
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error);

    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY_MS / 1000}s... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDB(retryCount + 1);
    }

    console.error("MongoDB connection failed after all retries. Exiting.");
    process.exit(1);
  }
};
