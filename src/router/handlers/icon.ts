import { NextFunction, Request, Response, Router } from "express";
import { resolve, join } from "path";

const router = Router({ mergeParams: true });

const loginCheckHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  next();
};

const uploadHandler = (req: Request, res: Response) => {
  return res.status(200).json("upload");
};

const updateHandler = (req: Request, res: Response) => {
  return res.status(200).json("update");
};

const deleteHandler = (req: Request, res: Response) => {
  return res.status(200).json("delete");
};

router.post("/upload", loginCheckHandler, uploadHandler);
router.post("/update", loginCheckHandler, updateHandler);
router.post("/delete", loginCheckHandler, deleteHandler);

export default router;
