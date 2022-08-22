import { Request } from "express";
import sharp from "sharp";

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

export const sleep = (time: number) => {
  return new Promise(resolve => setTimeout(resolve, time));
}

export const resizeImage = (inputPath: string, width: number): Promise<Buffer> => {
  const isGif = inputPath.endsWith("gif");

  return isGif 
  ? sharp(inputPath, {animated: true}).resize(width).gif().toBuffer()
  : sharp(inputPath).resize(width).toBuffer()
}

export const getIpFromRequest = (req: Request) => {
  return req.headers['cf-connecting-ip'] || 
    req.headers['x-forwarded-for'] || 
    req.headers["x-real-ip"] || 
    req.ip;
}

export const getRootFromRequest = (req: Request) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.get("Host");
  return `${protocol}://${host}`;
}
