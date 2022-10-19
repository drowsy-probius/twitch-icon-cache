import { Router, Request, Response, NextFunction } from "express";
import { notFound404 } from "./functions";

import Logger from "../../logger";
const logger = Logger(module.filename);

const router = Router({ mergeParams: true });

const cdnRedirector = (req: Request, res: Response, next: NextFunction) => {
  const requestedPathWithParams = req.originalUrl;
  return res.redirect(`/cdn${requestedPathWithParams}`);
}

router.all("/", notFound404);
router.all("*", cdnRedirector);

export default router;