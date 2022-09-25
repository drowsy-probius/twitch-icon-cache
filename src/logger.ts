import winston from "winston";
import winstonDaily from "winston-daily-rotate-file";
import { resolve, join } from "path";

const { format, transports, createLogger } = winston;
const { combine, timestamp, printf, colorize } = format;


/**
 * 인자로 파일 경로를 받음.
 * 
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
 */
export default (meta_url: string) => {
  // 앱 루트 디렉토리 절대 경로
  const root = resolve("./");
  // 인자로 받은 파일 경로를 .으로 대체
  const filepath = meta_url.replace(root, ".");
  // 로그파일 남길 경로
  const logDir = join(root, "log");

  // 로그 포맷
  const customFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}] ${filepath}: ${typeof(message) === "object" ? JSON.stringify(message) : message}${stack ? "\n"+stack : ""}`;
  });

  // 로그 파일 설정
  const customTransports = [
    new winstonDaily({
      level: "info",
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
  ];

  const errorStackTracer = format(info => {
    if(info.meta && info.meta instanceof Error)
    {
      info.message = `${info.message} ${info.meta.stack}`;
    }
    return info;
  })

  // winston 로그 객체 설정
  const loggerInstance = createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: combine(
      format.splat(),
      format.errors({ stack: true }),
      timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      customFormat,
      errorStackTracer(),
    ),
    defaultMeta: { service: "user-service" },
    transports: customTransports,
  });

  // Log also to console if not in production
  // production 단계가 아니면 콘솔에도 로그 표시. (위에 설정한 level까지만 표시함.)
  if (process.env.NODE_ENV !== "production") {
    loggerInstance.add(
      new transports.Console({
        format: combine(colorize(), customFormat),
      })
    );
  }

  return loggerInstance;
};