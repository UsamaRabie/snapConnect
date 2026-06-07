import mongoose from "mongoose";
import app from "./app";
import { config } from "./config/env";
import { connectDB } from "./config/db";
import { initSocket } from "./socket";

const start = async () => {
  await connectDB();

  const host = process.env.HOST || process.env.IP || "0.0.0.0";
  const server = app.listen(config.port, host, () => {
    console.log(`Server running on ${host}:${config.port} in ${config.nodeEnv} mode`);
  });

  initSocket(server);

  const gracefulShutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await mongoose.connection.close(false);
      console.log("MongoDB connection closed.");
      process.exit(0);
    });
    setTimeout(() => {
      console.error("Forced shutdown after timeout.");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  process.on("unhandledRejection", (err: Error) => {
    console.error("Unhandled Rejection:", err.message);
    server.close(() => process.exit(1));
  });

  process.on("uncaughtException", (err: Error) => {
    console.error("Uncaught Exception:", err.message);
    process.exit(1);
  });
};

start();
