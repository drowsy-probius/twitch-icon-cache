import { Request, Response, NextFunction } from "express";
import path from "path";

const handler = (req: Request, res: Response, next: NextFunction) => {
  return res.sendFile(path.join(__dirname, "../../../frontend/index.html"));
}

export default handler;