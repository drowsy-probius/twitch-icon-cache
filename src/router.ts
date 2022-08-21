import { Router, Express, Request, Response, NextFunction } from "express";

const router = Router();

router.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.send("404");
});

router.get("/list", (req: Request, res: Response, next: NextFunction) => {
  res.send("list")
});

router.get("/icon/:streamer", (req: Request, res: Response, next: NextFunction) => {

});

export default router;