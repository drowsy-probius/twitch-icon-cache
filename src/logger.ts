import winston from "winston";
import { resolve } from "path";
import { fileURLToPath } from "url";

const { format, transports, createLogger } = winston;
const { combine, timestamp, printf, colorize } = format;

export default (meta_url: string) => {
  const root = resolve("./");
  // const file = fileURLToPath(new URL(meta_url));
  const file_path = meta_url.replace(root, ".");

  const customFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}] ${file_path}: ${stack || message}`;
  });

  const loggerInstance = createLogger({
    level: "info",
    format: combine(
      timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      format.splat(),
      format.errors({ stack: true }),
      customFormat
    ),
    defaultMeta: { service: "user-service" },
    transports: [
      new transports.File({ filename: "log/error.log", level: "error" }),
      new transports.File({ filename: "log/common.log" }),
    ],
  });

  // Log also to console if not in production
  // if (process.env.NODE_ENV === "development") {
  if (true) {
    loggerInstance.add(
      new transports.Console({
        format: combine(colorize(), customFormat),
      })
    );
  }

  return loggerInstance;
};