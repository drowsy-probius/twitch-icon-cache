import { Router, Request, Response, NextFunction } from "express";

import Logger from "../../logger";

const router = Router({mergeParams: true});

const adminCheckHandler = async (req: Request, res: Response, next: NextFunction) => {
  next();
}

router.get('/', adminCheckHandler);

export default router;