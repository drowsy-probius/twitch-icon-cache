import express, { Request, Response, NextFunction} from 'express';
import compression from "compression";
import { Z_BEST_COMPRESSION } from 'zlib';
import cors from "cors";
import path from "path";

import router from "./router";
import { PORT, HOST } from './constants';
import { run_cronjob } from './background';
import { getIpFromRequest, getRootFromRequest } from "./functions";
import Logger from "./logger";
const logger = Logger(module.filename);

run_cronjob();

const app = express();

app.enable('trust proxy');
app.use(cors());
app.use(compression({
  level: Z_BEST_COMPRESSION,
}));
app.use(express.static(path.join(__dirname, "../frontend/")));
app.use((req: Request, res: Response, next: NextFunction) => {
  let loggerRoot = logger.http;

  if(req.originalUrl.startsWith("/refresh"))
  {
    loggerRoot = logger.warn;
  }
  else if(req.originalUrl.startsWith("/images"))
  {
    loggerRoot = logger.silly;
  }
  loggerRoot(`[${getIpFromRequest(req)}] ${req.method} ${getRootFromRequest(req)}${req.originalUrl}`);

  next();
});
app.use(router);
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`[${getIpFromRequest(req)}] ${req.method} ${getRootFromRequest(req)}${req.originalUrl} ${req}`);
  return res.json(err);
})

app.listen(PORT, HOST, () => {
    logger.info(`Server listening on ${HOST}:${PORT}`);
});