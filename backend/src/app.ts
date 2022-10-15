import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import compression from "compression";
import { Z_BEST_COMPRESSION } from "zlib";
import cors from "cors";
import path from "path";
import mongoose from "mongoose";

import router from "./router";
import {
  PORT,
  HOST,
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASS,
  DB_NAME,
} from "./constants";
import { run_cronjob } from "./background";
import { getIpFromRequest, getRootFromRequest } from "./functions";
import Logger from "./logger";
const logger = Logger(module.filename);

/**
 * mongodb 연결
 */
mongoose.connect(
  `mongodb://${DB_HOST}:${DB_PORT}`,
  {
    auth: {
      username: DB_USER,
      password: DB_PASS,
    },
    dbName: DB_NAME,
    autoIndex: true,
    zlibCompressionLevel: 6,
    loggerLevel: "debug",
    socketTimeoutMS: 0,
    connectTimeoutMS: 0,
  },
  () => {
    logger.debug(`database connected!`);
  }
);

/**
 * 서버 열기 전에 백그라운드 작업 등록
 */
run_cronjob();

// express 생성
const app = express();

// reverse proxy를 통할 때 header에 추가되는 ip사용하기 위함.
app.enable("trust proxy");
// cross domain 요청 허용
app.use(cors());
// json 데이터 압축해서 전송.
app.use(
  compression({
    level: Z_BEST_COMPRESSION,
  })
);

// body-parser를 사용해서 req body를 json으로 받기
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 루트(/)에 만들어 놓은 프론트엔드 앱 사용하기 위함.
app.use(express.static(path.join(__dirname, "../../frontend/")));
// 전체 접속 로그 남기는 미들웨어
app.use((req: Request, res: Response, next: NextFunction) => {
  let loggerRoot = logger.http;

  if (req.originalUrl.startsWith("/refresh")) {
    loggerRoot = logger.warn;
  } else if (req.originalUrl.startsWith("/images")) {
    loggerRoot = logger.silly;
  }
  loggerRoot(
    `[${getIpFromRequest(req)}] ${req.method} ${getRootFromRequest(req)}${
      req.originalUrl
    }`
  );

  next();
});
// 정의한 라우터 사용
app.use(router);

// constants.ts에서 정의한 호스트, 포트에 서버 열기
app.listen(PORT, HOST, () => {
  logger.info(`Server listening on ${HOST}:${PORT}`);
});

// 마지막 에러 핸들러.
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(
    `[${getIpFromRequest(req)}] ${req.method} ${getRootFromRequest(req)}${
      req.originalUrl
    } | ${err.stack}`
  );
  next(err);
});
