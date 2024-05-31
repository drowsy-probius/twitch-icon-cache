import { Request } from "express";
import axios from "axios";
import fs from "fs";
import sharp from "sharp";
import path, { resolve } from "path";

import {
  Icon,
  IconIndexPrototype,
  IconIndexBridgeBBCC,
  IconIndexOpenDccon,
} from "./@types/interfaces";
import { Logger } from "winston";
import LoggerFunction from "./Logger";

/**
 * 1s, 2m, 5d 등의 시간 문자열을 s 또는 ms 단위로 변경해줌.
 * 가능한 키워드: M, w, d, h, m, s
 * 2개 이상의 키워드를 중복해서는 안됨.
 * @param timeString
 * @param miliseconds
 * @returns number (ms)
 */
export const timeParser = (timeString: string, miliseconds = true) => {
  const unit =
    typeof timeString.slice(-1) === "string" ? timeString.slice(-1) : "s";
  const value = Number(timeString.slice(0, -1));
  const multiplier = miliseconds ? 1000 : 1;
  switch (unit) {
    case "M":
      return value * 30 * 24 * 60 * 60 * multiplier;
    case "w":
      return value * 7 * 24 * 60 * 60 * multiplier;
    case "d":
      return value * 24 * 60 * 60 * multiplier;
    case "h":
      return value * 60 * 60 * multiplier;
    case "m":
      return value * 60 * multiplier;
    case "s":
      return value * multiplier;
  }
  return multiplier;
};

/**
 * Promise를 이용해서 지정된 ms만큼 sleep함.
 * @param time
 * @returns Promise<>
 */
export const sleepForMs = (time: number) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};

/**
 *
 * @param directory `/some/path/to/image/{streamerName}`
 */
export const cleanDirectory = async (directory: string) => {
  if (!fs.existsSync(directory)) return;

  for (const file of await fs.promises.readdir(directory, {
    withFileTypes: true,
  })) {
    const target = path.join(directory, file.name);
    await fs.promises.rm(target, { recursive: true, force: true });
  }
};

/**
 * 스트리머 이름을 주면 해당 스트리머의 데이터가 저장된 폴더를 알려줌
 * @param streamerName 
 * @returns path-like-string
 */
export const getImageBasePath = (streamerName: string) => {
  return resolve(`./images/${streamerName}`);
}

/**
 * 스트리머 이름을 주면 해당 스트리머의 작은 이미지 파일이 저장된 폴더를 알려줌
 * @param imageSize 
 * @returns path-like-string
 */
export const getResizeBasePath = (streamerName: string, imageSize: number | string) => {
  return resolve(`./images/${streamerName}/${imageSize}`);
}

////////////////////////////////////////////////////////////

/**
 * sharp 모듈을 사용해서 `inputPath`에 해당하는 이미지를
 * `width`크기에 맞춰서 줄인 뒤 이미지 버퍼를 생성함.
 * @param inputPath 
 * @param width 
 * @returns resized Promise<Buffer>
 */
export const resizeImage = (inputPath: string, width: number): Promise<Buffer> => {
  // gif 파일 대응
  const isGif = inputPath.endsWith("gif");

  return isGif 
  ? sharp(inputPath, {animated: true}).resize(width).gif().toBuffer()
  : sharp(inputPath).resize(width).toBuffer()
}


/**
 * `executable`을 성공할 때까지 최대 `maxretry`만큼 실행한다. 
 * @param executable Function or Promise 
 * @param failMessage 
 * @param maxretry 
 * @returns Promise<any>
 */
export const retryWithSleep = async (executable: CallableFunction, failMessage: string, logger: Logger, maxretry=5): Promise<unknown> => {
  let tries = 0;
  let error;
  while(tries < maxretry)
  {
    try
    {
      const ret = await executable();
      return ret;
    }
    catch(err)
    {
      error = err;
      /**
       * 2의 지수만큼 sleep함.
       */
      const sleepSecs = Math.min(Math.pow(2, tries) + Math.random(), 64)
      tries += 1;
      logger.error(`try:${tries} ${failMessage} ${err}. Wait for ${sleepSecs} seconds.`);
      await sleepForMs(sleepSecs * 1000);
    }
  }
  return error;
}

////////////////////////////////////////////////////////////////

/**
 * express Request 객체를 받아서 실제 ip를 알려줌.
 * 
 * @param req express.Request
 * @returns string
 */
export const getIpFromRequest = (req: Request) => {
  if (req.headers) {
    return (
      req.headers["cf-connecting-ip"] ||
      req.headers["x-forwarded-for"] ||
      req.headers["x-real-ip"]
    );
  }
  return req.ip;
}

/**
 * express Request를 받아서 접속한 프로토콜+도메인을 알려줌
 * @param req express.Request
 * @returns string
 */
export const getRootFromRequest = (req: Request) => {
  /**
   * Just assumes that the protocol of connection via cloudflare is https 
   */
  const protocol =
    req.headers && req.headers["cf-connecting-ip"] ? "https" : req.protocol;
  const host = req.get("Host");
  return `${protocol}://${host}`;
}

/**
 * `url`으로부터 이미지 버퍼를 받아서 `savePath`에 저장함.
 * @param url remote image url
 * @param savePath local file path
 * @returns 
 */
export const saveImage = (url: string, savePath: string, logger: Logger) => retryWithSleep(async () => {
  /**
   * sleep 해서 타겟 서버 부하 줄이기?
   */
  await sleepForMs(Math.random() * 10000);

  /**
    * 어떤 주소는 한글이 포함되어 있고 어떤 주소는 한글이 이미 encode된 것이 있어서
    * 한번 디코딩한 뒤에 인코딩하면 unescaped 에러 없이 요청이 가능함. 
    */
  const res = await axios.get(encodeURI(decodeURI(url)), {
    responseType: "arraybuffer",
  });
  await fs.promises.writeFile(savePath, res.data);
  logger.debug(`[saveImage] Download image from ${url} to ${savePath}`);
  return true;
}, `[saveImage] ${url} -> ${savePath}`, logger)


/**
 * `imagePath`로부터 이미지 버퍼를 읽어와서 어떤 절차(resize)를 거친 뒤 
 * filename에 저장함.
 * @param imagePath local file path
 * @param filename 
 * @returns 
 */
export const resizeAndSaveImage = (imagePath: string, filename: string, imageSize: number, logger: Logger) => retryWithSleep(async () => {
  await fs.promises.writeFile(filename, await resizeImage(imagePath, imageSize));
  logger.debug(`[resizeAndSaveImage] (${imageSize}px) Convert image to ${filename}`);
  return true;
}, `[resizeAndSaveImage] (${imageSize}px) ${imagePath} -> ${filename}`, logger)


/**
 * `jsonData`는 어떤 데이터여도 상관 없으나 json데이터를 상정함.
 * `savePath`에 해당 `jsonData`를 `JSON.stringify`를 사용해서 저장함.
 * @param jsonData any
 * @param savePath 
 * @returns 
 */
export const saveJsonFile = (jsonData: IconIndexPrototype, savePath: string, logger: Logger) => retryWithSleep(async () => {
  await fs.promises.writeFile(savePath, JSON.stringify(jsonData, null, 2), "utf8");
  logger.debug(`[saveJsonFile] Save json to ${savePath}`);
  return true;
}, `[saveJsonFile] ${JSON.stringify(jsonData).slice(0, 100)} -> ${savePath}`, logger)


/**
 * 두 json파일을 비교해서 localJson이 remoteJson과 다르다면
 * true를 리턴함.
 * @param localJson 
 * @param remoteJson 
 * @returns 
 */
export const doUpdateJson = (localJson: Icon[], remoteJson: IconIndexOpenDccon | IconIndexBridgeBBCC) => {
  const logger = LoggerFunction(`${module.filename}::doUpdateJson`);
  const getJsonFromJsonFromUrl = (remoteJson: IconIndexOpenDccon | IconIndexBridgeBBCC) => {
    if("dccons" in remoteJson)
    {
      logger.debug(`remote json type is IconIndexOpenDccon`);
      return remoteJson.dccons;
    }
    if("dcConsData" in remoteJson)
    {
      logger.debug(`remote json type is IconIndexBridgeBBCC`);
      return remoteJson.dcConsData;
    }
    logger.debug(`unknown json type ${remoteJson}`);
    return [];
  }


  const jsonFromFile = localJson;
  const jsonFromUrl = getJsonFromJsonFromUrl(remoteJson);

  // 원격 json파일에서 요소를 제거했을 수도 있으니 같지 않음으로 비교함.
  if(jsonFromUrl.length !== jsonFromFile.length)
  {
    logger.debug(`download new json by different length. local: ${jsonFromFile.length} remote: ${jsonFromUrl.length}`);
    return true;
  }

  for(let i=0; i<jsonFromUrl.length; i++)
  {
    // 만약 로컬에서 새로운 키워드를 추가해서 제공하려면 여기를 <으로 바꾸어야 함.
    if(jsonFromUrl[i].keywords !== undefined)
    {
      if(jsonFromUrl[i].keywords.length !== jsonFromFile[i].keywords.length)
      {
        logger.debug(`download new json by different keywords length. local: ${jsonFromFile[i].keywords} remote: ${jsonFromUrl[i].keywords}`);
        return true;
      }
      for(const keyword of jsonFromUrl[i].keywords) 
      {
        if(!jsonFromFile[i].keywords.includes(keyword))
        {
          logger.debug(`download new json by new keywords detected. local: ${jsonFromFile[i].keywords} remote: ${jsonFromUrl[i].keywords}`);
          return true;
        }
      }
    }

    // 만약 로컬에서 새로운 태그를 추가해서 제공하려면 여기를 <으로 바꾸어야 함.
    // 원격 태그 길이가 0일 때는 로컬에서 '미지정'을 추가하므로 그 경우는 제외함.
    if(jsonFromUrl[i].tags !== undefined)
    {
      if(jsonFromUrl[i].tags.length !== 0 && jsonFromUrl[i].tags.length !== jsonFromFile[i].tags.length)
      {
        logger.debug(`download new json by different tags length. local: ${jsonFromFile[i].tags} remote: ${jsonFromUrl[i].tags}`);
        return true;
      }
      for(const tag of jsonFromUrl[i].tags) 
      {
        if(!jsonFromFile[i].tags.includes(tag))
        {
          logger.debug(`download new json by new tags detected. local: ${jsonFromFile[i].tags} remote: ${jsonFromUrl[i].tags}`);
          return true;
        }
      }
    }
  }
  return false;
}