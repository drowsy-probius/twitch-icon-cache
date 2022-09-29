import { Router, Request, Response, NextFunction } from "express";
import { join } from "path";
import { 
  getIpFromRequest, 
  getRootFromRequest,
  getImageSubPaths,
  imageSizeWidth,
  getImageBasePath,
} from "../../functions";
import { existsSync } from "fs";
import { Icon } from "../../@types/interfaces";
import { IconListModel } from "../../database";

import Logger from "../../logger";
const logger = Logger(module.filename);

const router = Router({mergeParams: true});


const imageDatabaseCheckHandler = async (req: Request, res: Response, next: NextFunction) => {
  // url encode된 글자가 있을 수 있으므로 decode함.
  const imageHash = decodeURI(req.params.imageHash);
  const imageDoc = await IconListModel.findOne({iconHash: imageHash});
  if(imageDoc === null)
  {
    logger.warn(`[${getIpFromRequest(req)}] ${req.method} ${getRootFromRequest(req)}${req.originalUrl} | No image`);
    return res.status(404).json({
      status: false,
      message: `No image ${imageHash}`
    });
  }
  res.locals.imageHash = imageHash;
  next();
}

const appendSizeHandler = (req: Request, res: Response, next: NextFunction) => {
  res.locals.size = "original";
  next();
}

const imagePathResolveHandler = (req: Request, res: Response, next: NextFunction) => {
  const imageHash = `${res.locals.imageHash}`;
  const imageParamSize = `${req.params.size}` || `${res.locals.size}`;
  const sizeOptions = Object.keys(imageSizeWidth);
  const size = sizeOptions.includes(imageParamSize) ? imageParamSize : "original";

  /**
   * parameter로 받은 streamer와 image로부터
   * 원본 크기 이미지와 축소된 이미지의 로컬 경로를 계산함
   */
  const basePath = getImageBasePath();
  const imagePath = join(basePath, size, `${imageHash}.webp`);
  
  res.locals.imagePath = imagePath;
  next();
}

const imageExistsInLocal = (req: Request, res: Response, next: NextFunction) => {
  const imagePath = `${res.locals.imagePath}`;
  if(!existsSync(imagePath))
  {
    logger.warn(`[${getIpFromRequest(req)}] ${req.method} ${getRootFromRequest(req)}${req.originalUrl} | No image`);
    return res.status(404).json({
      status: false,
      message: `No image ${imagePath}`
    });
  }
  next();
}

const imageHandler = (req: Request, res: Response) => {
  const imagePath = `${res.locals.imagePath}`;
  return res.status(200).sendFile(imagePath);
}

router.get("/:imageHash", imageDatabaseCheckHandler, appendSizeHandler, imagePathResolveHandler, imageExistsInLocal, imageHandler);
router.get("/:imageHash/:size", imageDatabaseCheckHandler, imagePathResolveHandler, imageExistsInLocal, imageHandler);

export default router;