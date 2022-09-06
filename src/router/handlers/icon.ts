import { Request, Response, NextFunction } from "express";
import { resolve, join } from "path";

import { ICON_SIZE } from "../../constants";

const basePath = resolve("./public/icon");

const handler = (req: Request, res: Response, next: NextFunction) => {
  const size = req.query.size ? Number(req.query.size) : 128;
  const imagePath = join(basePath, `${size}.icon.png`);

  /**
   * query로 요청한 크기가 없으면 404를 리턴함.
   * fs.exists로 판정해도 되겠지만 
   * 이 방식이 융통성은 없더라도 빠르다고 생각함. 
   */
  if(!ICON_SIZE.includes(size))
  {
    return res.status(404).json({
      status: false,
      message: `there is no image for ${imagePath}`
    });
  }
  
  return res.status(200).contentType(`image/png`).sendFile(imagePath);
}

export default handler;