import { Request } from "express";
import axios from "axios";
import fs from "fs";
import sharp from "sharp";
import { resolve } from "path";

import { Icon, IconPrototype } from "./@types/interfaces";
import Logger from "./logger";
const logger = Logger(module.filename);


export const timeParser = (timeString: string, miliseconds=true) => {
  const unit = typeof(timeString.slice(-1)) === "string" ? timeString.slice(-1) : 's';
  const value = Number(timeString.slice(0, -1));
  const multiplier = miliseconds ? 1000 : 1;
  switch(unit)
  {
    case("M"):
      return value * 30 * 24 * 60 * 60 * multiplier;
    case("w"):
      return value * 7 * 24 * 60 * 60 * multiplier;
    case("d"):
      return value * 24 * 60 * 60 * multiplier;
    case("h"):
      return value * 60 * 60 * multiplier;
    case("m"):
      return value * 60 * multiplier;
    case("s"):
      return value * multiplier;
  }
  return multiplier;
}

export const sleepForMs = (time: number) => {
  return new Promise(resolve => setTimeout(resolve, time));
}

export const getImageBasePath = (streamerName: string) => {
  return resolve(`./images/${streamerName}`);
}

export const getThumbnailBasePath = (streamerName: string) => {
  return resolve(`./images/${streamerName}/thumbnail`);
}

////////////////////////////////////////////////////////////

export const resizeImage = (inputPath: string, width: number): Promise<Buffer> => {
  const isGif = inputPath.endsWith("gif");

  return isGif 
  ? sharp(inputPath, {animated: true}).resize(width).gif().toBuffer()
  : sharp(inputPath).resize(width).toBuffer()
}


export const retryWithSleep = async (executable: any, failMessage: string, maxretry=5): Promise<unknown> => {
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
      const sleepSecs = Math.min(Math.pow(2, tries) + Math.random(), 64)
      tries += 1;
      logger.error(`try:${tries} ${failMessage} ${err}. Wait for ${sleepSecs} seconds.`);
      await sleepForMs(sleepSecs * 1000);
    }
  }
  return error;
}

////////////////////////////////////////////////////////////////

export const getIpFromRequest = (req: Request) => {
  return req.headers['cf-connecting-ip'] || 
    req.headers['x-forwarded-for'] || 
    req.headers["x-real-ip"] || 
    req.ip;
}

export const getRootFromRequest = (req: Request) => {
  /**
   * Just assumes that the protocol of connection via cloudflare is https 
   */
  const protocol = req.headers['cf-connecting-ip'] ? "https" : req.protocol;
  const host = req.get("Host");
  return `${protocol}://${host}`;
}


export const saveImage = (url: string, savePath: string) => retryWithSleep(async () => {
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
}, `[saveImage] ${url} -> ${savePath}`)



export const saveThumbnail = (imagePath: string, filename: string) => retryWithSleep(async () => {
  await fs.promises.writeFile(filename, await resizeImage(imagePath, 40));
  logger.debug(`[saveThumbnail] Convert image to ${filename}`);
  return true;
}, `[saveThumbnail] ${imagePath} -> ${filename}`)



export const saveJsonFile = (jsonData: any, savePath: string) => retryWithSleep(async () => {
  await fs.promises.writeFile(savePath, JSON.stringify(jsonData, null, 2), "utf8");
  logger.debug(`[saveJsonFile] Save json to ${savePath}`);
  return true;
}, `[saveJsonFile] ${jsonData.length} -> ${savePath}`)


export const saveRawFile = (data: any, savePath: string) => retryWithSleep(async () => {
  if(typeof(data) === "object") return saveJsonFile(data, savePath);
  await fs.promises.writeFile(savePath, data, "utf8");
  logger.debug(`[saveRawFile] Save data to ${savePath}`);
  return true;
}, `[saveRawFile] ${data.length} -> ${savePath}`)

export const doUpdateJson = (localJson: Icon[], remoteJson: IconPrototype[]) => {
  /**
   * 
   */
  const jsonFromFile = localJson;
  const jsonFromUrl = remoteJson;

  if(jsonFromUrl.length > jsonFromFile.length) return true;

  for(let i=0; i<jsonFromUrl.length; i++)
  {
    if(jsonFromUrl[i].uri !== jsonFromFile[i].originUri) return true;
    if(Object.keys(jsonFromUrl[i]).length !== Object.keys(jsonFromFile[i]).length) return true;
    if(jsonFromUrl[i].name !== jsonFromFile[i].name) return true;
    if(jsonFromUrl[i].keywords.length !== jsonFromFile[i].keywords.length) return true;
    for(const keyword of jsonFromUrl[i].keywords) if(!jsonFromFile[i].keywords.includes(keyword)) return true;
    if(jsonFromUrl[i].tags.length !== jsonFromFile[i].tags.length) return true;
    for(const tag of jsonFromUrl[i].tags) if(!jsonFromFile[i].tags.includes(tag)) return true;
  }
  return false;
}