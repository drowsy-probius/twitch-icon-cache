import { resolve } from "path";
import sharp from "sharp";
import { sleepForMs } from "../functions";
import { Logger } from "winston";
import axios from "axios";
import { writeFile } from "fs/promises";
import { existsSync } from 'fs';
import { model } from "mongoose";
import { 
  iconListModel
} from "../database";
import { 
  Icon,
  StreamerData, 
  ImageSize,
} from "../@types/interfaces";

export const imageSizeWidth = {
  large: 100,
  medium: 70,
  small: 40,
}

/**
 * 스트리머 이름을 주면 해당 스트리머의 데이터가 저장된 폴더를 알려줌
 * @param streamerName 
 * @returns path-like-string
 */
export const getImageBasePath = () => {
  return resolve(`./images/`);
}

/**
 * 스트리머 이름을 주면 해당 스트리머의 작은 이미지 파일이 저장된 폴더를 알려줌
 * @param streamerName 
 * @returns path-like-string
 */
export const getImageSubPaths = () => {
  const basePath = getImageBasePath();
  return {
    "large": resolve(basePath, "large"),
    "medium": resolve(basePath, "medium"),
    "small": resolve(basePath, "small"),
  }
}

/**
 * sharp 모듈을 사용해서 `inputPath`에 해당하는 이미지를
 * `width`크기에 맞춰서 줄인 뒤 이미지 버퍼를 생성함.
 * @param inputPath 
 * @param width 
 * @returns resized Promise<Buffer>
 */
export const resizeImage = (imageBuffer: Buffer, width: number): Promise<Buffer> => {
  const image = sharp(imageBuffer, {animated: true});
  return image.resize({width: width, height: width}).webp({loop: 0}).toBuffer();
}


/**
 * `url`으로부터 이미지 버퍼를 가져온다
 * @param url remote image url
 * @param savePath local file path
 * @returns 
 */
export const fetchImageAsBuffer = async (url: string, logger: Logger) => {
  /**
   * sleep 해서 타겟 서버 부하 줄이기?
   */
  await sleepForMs(Math.random() * 5000);

  /**
  * 어떤 주소는 한글이 포함되어 있고 어떤 주소는 한글이 이미 encode된 것이 있어서
  * 한번 디코딩한 뒤에 인코딩하면 unescaped 에러 없이 요청이 가능함. 
  */
  const imageUrlRes = await axios.get(encodeURI(decodeURI(url)), {
    responseType: "arraybuffer",
  });
  logger.debug(`[fetchImageAsBuffer] fetch image buffer from ${url}`);
  return Buffer.from(imageUrlRes.data, "base64");
}


export const saveImage = async (imageBuffer: Buffer, savePath: string, logger: Logger) => {
  await writeFile(savePath, imageBuffer);
  logger.debug(`[saveImage] save to ${savePath}`);
  return true;
}


export const saveIcon = async (imageBuffer: Buffer, icon: Icon, streamerName: string, logger: Logger): Promise<Icon> => {
  try 
  {
    const subPaths = getImageSubPaths();

    for(const _size of Object.keys(subPaths))
    {
      const size = _size as ImageSize;
      await saveImage(
        await resizeImage(imageBuffer, imageSizeWidth[size]),
        resolve(subPaths[size], `${icon.iconHash}.webp`),
        logger
      )
    }

    try 
    {
      await iconListModel.create({
        iconHash: icon.iconHash,
        uploadedBy: streamerName,
      });
    }
    catch(err: any)
    {
      if(err.code === 11000) // dup key error caused by race condition
      {
        logger.warn(err); 
      }
      else 
      {
        logger.error(`[saveIcon] insert to iconttv.iconListModel failed ${JSON.stringify(err, null, 2)}`);
      }
    }

    return icon;
  }
  catch(err)
  {
    logger.error(err);
    icon.useOrigin = true;
    return icon;
  }
}

/**
 * sha256 해시를 사용함
 * createHash('sha256').update(string | Buffer | ...).digest('hex');
 */
export const isImageInLocal = async (iconHash: string): Promise<boolean> => {
  try
  {
    const queryResult = await iconListModel.count({ iconHash: iconHash });
    return queryResult > 0;
  }
  catch(err)
  {
    return false; // assume it has no duplicated items.
  }
}
