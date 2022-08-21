import { Request, Response, NextFunction } from "express";
import { STREAMER_DATA } from "../data";

const handler = (req: Request, res: Response, next: NextFunction) => {
  res.json(STREAMER_DATA);
}

export default handler;