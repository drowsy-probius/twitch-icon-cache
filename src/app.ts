import express, {Request, Response, NextFunction} from 'express';

import router from "./router";
import { PORT, HOST } from './constants';
import { run_cronjob } from './background';
import Logger from "./logger";
const logger = Logger(module.filename);

run_cronjob();

const app = express();

app.use((req: Request, res: Response, next: NextFunction) => {
  const ip = req.headers["x-real-ip"] || req.ip;
  logger.info(`[${ip}] ${req.method} ${req.url}`);
  next();
});
app.use(router);

app.listen(PORT, HOST, () => {
    logger.info(`Server listening on ${HOST}:${PORT}`);
});