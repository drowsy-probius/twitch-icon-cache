import { resolve } from "path";
import sharp from "sharp";
import { sleepForMs, getImageSubPaths, imageSizeWidth } from "../functions";
import { Logger } from "winston";
import axios from "axios";
import { writeFile, unlink } from "fs/promises";
import { IconListModel, StreamerListModel } from "../database";
import { Icon, ImageSize } from "../@types/interfaces";
import retry from "async-retry";

/**
 * sharp 모듈을 사용해서 `inputPath`에 해당하는 이미지를
 * `width`크기에 맞춰서 줄인 뒤 이미지 버퍼를 생성함.
 * @param inputPath
 * @param width
 * @returns resized Promise<Buffer>
 */
export const resizeImage = (
  imageBuffer: Buffer,
  width: number
): Promise<Buffer> => {
  const image = sharp(imageBuffer, { animated: true });
  return image
    .resize({ width: width, height: width })
    .webp({ loop: 0 })
    .toBuffer();
};

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
};

export const saveImage = async (
  imageBuffer: Buffer,
  savePath: string,
  logger: Logger
) => {
  await writeFile(savePath, imageBuffer);
  logger.debug(`[saveImage] save to ${savePath}`);
  return true;
};

/**
 * 로컬 폴더에 이미지를 저장한 후 
 * IconListModel 에 항목을 추가함.
 * 
 * @param imageBuffer 
 * @param icon 
 * @param streamerName 
 * @param logger 
 * @returns 
 */
export const saveIcon = async (
  imageBuffer: Buffer,
  icon: Icon,
  streamerName: string,
  logger: Logger
): Promise<Icon> => {
  try {
    const subPaths = getImageSubPaths();

    for (const _size of Object.keys(subPaths)) {
      const size = _size as ImageSize;
      const buffer =
        size === "original"
          ? imageBuffer
          : await resizeImage(imageBuffer, imageSizeWidth[size]);
      await saveImage(
        buffer,
        resolve(subPaths[size], `${icon.iconHash}.webp`),
        logger
      );
    }

    try {
      const streamerDoc = await StreamerListModel.findOne({
        name: streamerName,
      });
      if (streamerDoc === null) {
        throw new Error(
          `${streamerName} is not exists in streamerList database.`
        );
      }

      await IconListModel.create({
        iconHash: icon.iconHash,
        uploadedBy: streamerDoc._id,
      });
    } catch (err: any) {
      if (err.code === 11000) {
        // dup key error caused by race condition
        logger.warn(err);
      } else {
        logger.error(
          `[saveIcon] insert to iconttv.iconListModel failed ${JSON.stringify(
            err,
            null,
            2
          )}`
        );
      }
    }

    return icon;
  } catch (err) {
    logger.error(err);
    icon.useOrigin = true;
    return icon;
  }
};

export const deleteIcon = async (iconHash: string, logger: Logger) => {
  const subPaths = getImageSubPaths();
  for (const _size of Object.keys(subPaths)) {
    const size = _size as ImageSize;
    const imagePath = resolve(subPaths[size], `${iconHash}.webp`);
    await retry(() => unlink(imagePath), {
      retries: 3,
    });
    logger.debug(`${imagePath} deleted`);
  }
}

/**
 * sha256 해시를 사용함
 * createHash('sha256').update(string | Buffer | ...).digest('hex');
 */
export const isImageInLocal = async (iconHash: string): Promise<boolean> => {
  try {
    const queryResult = await IconListModel.count({ iconHash: iconHash });
    return queryResult > 0;
  } catch (err) {
    return false; // assume it has no duplicated items.
  }
};
