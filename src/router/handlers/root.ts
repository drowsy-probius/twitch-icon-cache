import { Request, Response, NextFunction } from "express";
import path from "path";

/**
 * 도메인 루트에 접근하면 프론트엔드 앱 페이지를 보여줌.
 */
const handler = (req: Request, res: Response, next: NextFunction) => {
  return res.sendFile(path.join(__dirname, "../../../frontend/index.html"));
}

export default handler;