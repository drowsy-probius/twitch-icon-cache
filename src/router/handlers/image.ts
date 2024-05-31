import { Request, Response } from "express";
import { resolve, join, extname } from "path";
import { existsSync, readdirSync, readFileSync } from "fs";

import { FAILED_LIST_FILE, ICON_SIZE, IMAGE } from "../../constants";
import { getIpFromRequest, getRootFromRequest, getImageBasePath, getResizeBasePath } from "../../functions";
import { Icon } from "../../@types/interfaces";

import Logger from "../../Logger";
const logger = Logger(module.filename);

const handler = async (req: Request, res: Response) => {
  const streamer = req.params.streamer;
  // url encode된 글자가 있을 수 있으므로 decode함.
  const image = decodeURI(req.params.image);
  /**
   * 요청 주소에 ?small이 있으면 작은 이미지를 리턴함. 
   * 웹 앱에서 조금 더 빠른 로딩을 위해서 설정함.
   * 
   * 240601
   * ?small : legacy
   */
  const paramSize = "small" in req.query ? 32 : (
    ICON_SIZE.includes(Number(req.query['size'])) ? Number(req.query['size']) : NaN
  );
  const isParamSizeExists = Number.isNaN(paramSize)

  /**
   * parameter로 받은 streamer와 image로부터
   * 원본 크기 이미지와 축소된 이미지의 로컬 경로를 계산함
   */
  const basePath = isParamSizeExists ? getImageBasePath(streamer) : getResizeBasePath(streamer, paramSize);
  const imagePath = join(basePath, image)

  /**
   * 요청 시에 파일 확장자를 지정하지 않아도 동작하도록 설정함.
   */
  if(!existsSync(imagePath))
  {
    const file = readdirSync(basePath).filter(i => i.startsWith(image));
    if(file.length !== 1)
    {
      logger.warn(`[${getIpFromRequest(req)}] ${req.method} ${getRootFromRequest(req)}${req.originalUrl} | No image`);
      return res.status(404).json({
        status: false,
        message: `No image ${image}`
      });
    }
    return res.redirect(`${file[0]}${isParamSizeExists ? '?size=48' : ''}`);
  }

  /**
   * 로컬 이미지 경로로부터 이미지의 확장자를 알아냄.
   * 실제로는 parameter로 받은 값에서 얻어내는 것임.
   * 실제 파일 헤더를 읽는 것보다 빠르다고 생각함.
   * 
   * extname함수는 .을 포함한 확장자명을 리턴함.
   */
  const ext = extname(imagePath); // .이 포함되어 있음.
  /**
   * 가리키는 파일이 이미지가 아니면 404로 응답함.
   */
  if(!IMAGE.includes(ext))
  {
    logger.warn(`[${getIpFromRequest(req)}] ${req.method} ${getRootFromRequest(req)}${req.originalUrl} | Not image`);
    return res.status(404).json({
      status: false,
      message: `That file is not image ${image} -> ${ext}`
    });
  }

  /**
   * 서버에서 백그라운드 작업을 할 때 다운로드 실패한 이미지 목록을 읽어옴.
   * 이 JSON파일은 키로 nameHash를 가짐.
   */
  const failedListFile = resolve(join(getImageBasePath(streamer), FAILED_LIST_FILE));
  let failedListJson: {[key: string]: Icon} = {};
  if(existsSync(failedListFile))
  {
    const failedList = readFileSync(failedListFile, "utf8");
    failedListJson = JSON.parse(failedList);
  }
  /**
   * parameter로 요청한 image 값은 nameHash.ext 형식이니까
   * ext를 제외한 부분을 가져옴.
   */
  const imageName = image.split(".").slice(0, -1).join(".");
  /**
   * 요청한 이미지가 다운로드에 실패한 이미지라면
   */
  if(imageName in failedListJson)
  {
    logger.warn(`[${getIpFromRequest(req)}] ${req.method} ${getRootFromRequest(req)}${req.originalUrl} | Failed image`);
    /**
     * 실패한 이미지 목록에서 originUri 값이 존재하면 
     * 해당 주소로 redirect시키고 아니라면 404를 리턴함.
     * 
     * 플러그인에서 이미지 로딩 실패 시에 (400번대 statusCode 받을 때)
     * onerror 리스너로 백업 이미지 보여주도록 하기도 했음.
     */
    return failedListJson[image].originUri 
    ? res.status(302).redirect(failedListJson[image].originUri)
    : res.status(404).json({
      status: false,
      message: `Failed image ${image}`
    });
  }

  /**
   * 요청한 이미지가 존재하지 않는 경우에
   */
  if(!existsSync(imagePath))
  {
    logger.warn(`[${getIpFromRequest(req)}] ${req.method} ${getRootFromRequest(req)}${req.originalUrl} | No image`);
    return res.status(404).json({
      status: false,
      message: `No image ${image}`
    });
  }

  return res.status(200).sendFile(imagePath);
}

export default handler;