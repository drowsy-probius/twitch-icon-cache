import { Request, Response, NextFunction } from "express";
import { resolve, join } from "path";
import fs from "fs";

import { ICON_SIZE } from "../../constants";

const basePath = resolve("./public/icon");

const handler = (req: Request, res: Response, next: NextFunction) => {
  const size = req.query.size ? Number(req.query.size) : 128;
  const imagePath = join(basePath, `${size}.icon.png`);

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