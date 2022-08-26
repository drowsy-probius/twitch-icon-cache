import winston from "winston";
import winstonDaily from "winston-daily-rotate-file";
import { resolve, join } from "path";

const { format, transports, createLogger } = winston;
const { combine, timestamp, printf, colorize } = format;


/**
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
 */
export default (meta_url: string) => {
  const root = resolve("./");
  const file_path = meta_url.replace(root, ".");
  const logDir = join(root, "log");

  const customFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}] ${file_path}: ${stack || typeof(message) === "object" ? JSON.stringify(message) : message}`;
  });

  const customTransports = [
    new winstonDaily({
      filename: "all-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "60d",
      dirname: logDir,
    }),
    new winstonDaily({
      level: "error",
      filename: "error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "60d",
      dirname: logDir,
    }),
  ]

  const loggerInstance = createLogger({
    level: "http",
    format: combine(
      timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      format.splat(),
      format.errors({ stack: true }),
      customFormat
    ),
    defaultMeta: { service: "user-service" },
    transports: customTransports,
  });

  // Log also to console if not in production
  if (process.env.NODE_ENV !== "production") {
    loggerInstance.level = "debug";
    loggerInstance.add(
      new transports.Console({
        format: combine(colorize(), customFormat),
      })
    );
  }

  return loggerInstance;
};