import express, { Request, Response, NextFunction} from 'express';
import cors from "cors";

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
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`[${getIpFromRequest(req)}] ${req.method} ${getRootFromRequest(req)}${req.originalUrl}`);
  next();
});
app.use(router);
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(err);
  res.status(503)
  return res.render("error", {error: err});
})

app.listen(PORT, HOST, () => {
    logger.info(`Server listening on ${HOST}:${PORT}`);
});