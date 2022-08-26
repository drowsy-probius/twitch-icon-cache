import { Request } from "express";
import path from "path";
import crypto from "crypto";
import { IMGPROXY_API, IMGPROXY_ENABLE, IMGPROXY_KEY, IMGPROXY_SALT } from "./constants";

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

const urlSafeEncode = (data: any) => {
  return Buffer.from(data, "utf8")
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\//g, '_')
    .replace(/\+/g, '-');
}

export const createImgproxyUrl = (source: string, options:{[key:string]: any}={}, length?: number) => {
  if(!IMGPROXY_ENABLE) return source;
  const encodedUrl = urlSafeEncode(source);
  const resize = options.size || "";
  const ext = path.extname(source) || ""; // .이 포함되어있어야 함.
  const enlarge = 0;
  const gravity = false;
  const hashLength = length ?? 32;

  const subPath = `/rs:auto:${resize}:${resize}:${enlarge}/g:${gravity ? "yes" : "no"}/${encodedUrl}${ext}`;
  const hmac = crypto.createHmac("sha256", Buffer.from(IMGPROXY_KEY, "hex"))
                  .update(Buffer.from(IMGPROXY_SALT, "hex"))
                  .update(subPath)
                  .digest();
  return new URL(path.join(urlSafeEncode(hmac), subPath), IMGPROXY_API).href;
}