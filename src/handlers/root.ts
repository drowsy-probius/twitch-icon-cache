import { Request, Response, NextFunction } from "express";

const handler = (req: Request, res: Response, next: NextFunction) => {
  res.send("404");
}

export default handler;