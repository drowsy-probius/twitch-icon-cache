import { Request, Response, Router } from "express";
import { resolve, join } from "path";

const router = Router({ mergeParams: true });

const handler = (req: Request, res: Response) => {
  return res.status(200).json(1);
};

export default router;
