import { Request, Response } from "express";
import { resolve, join, extname } from "path";
import { existsSync, readdirSync, readFileSync } from "fs";

import { FAILED_LIST_FILE, IMAGE } from "../../constants";
import { getIpFromRequest, getRootFromRequest } from "../../functions";
import { getImageBasePath } from "../../iconIndexProcessor/functions";
import { Icon } from "../../@types/interfaces";
import { IconListModel } from "../../database";

import Logger from "../../logger";
const logger = Logger(module.filename);

const handler = async (req: Request, res: Response) => {
  const streamer = req.params.streamer;
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

  /**
   * 요청 주소에 ?small이 있으면 작은 이미지를 리턴함. 
   * 웹 앱에서 조금 더 빠른 로딩을 위해서 설정함.
   */
  const querySize = (req.query.size)?.toString() || "";
  const size = ["small", "medium", "large"].includes(querySize) ? querySize : "large";

  /**
   * parameter로 받은 streamer와 image로부터
   * 원본 크기 이미지와 축소된 이미지의 로컬 경로를 계산함
   */
  const basePath = getImageBasePath();
  const imagePath = join(basePath, size, `${imageHash}.webp`);
  return res.status(200).sendFile(imagePath);
}

export default handler;