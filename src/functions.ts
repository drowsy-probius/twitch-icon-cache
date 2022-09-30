import { Request } from "express";
import axios from "axios";
import fs from "fs";
import { resolve } from "path";

import {
  Icon,
  IconIndexPrototype,
  IconIndexBridgeBBCC,
  IconIndexOpenDccon,
} from "./@types/interfaces";
import { Logger } from "winston";
import LoggerFunction from "./logger";

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

////////////////////////////////////////////////////////////

/**
 * express Request 객체를 받아서 실제 ip를 알려줌.
 *
 * @param req express.Request
 * @returns string
 */
export const getIpFromRequest = (req: Request) => {
  return (
    req.headers["cf-connecting-ip"] ||
    req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.ip
  );
};

/**
 * express Request를 받아서 접속한 프로토콜+도메인을 알려줌
 * @param req express.Request
 * @returns string
 */
export const getRootFromRequest = (req: Request) => {
  /**
   * Just assumes that the protocol of connection via cloudflare is https
   */
  const protocol = req.headers["cf-connecting-ip"] ? "https" : req.protocol;
  const host = req.get("Host");
  return `${protocol}://${host}`;
};

/**
 * 두 json파일을 비교해서 localJson이 remoteJson과 다르다면
 * true를 리턴함.
 * @param localJson
 * @param remoteJson
 * @returns
 */
export const doUpdateJson = (
  localJson: Icon[],
  remoteJson: IconIndexOpenDccon | IconIndexBridgeBBCC
) => {
  const logger = LoggerFunction(`${module.filename}::doUpdateJson`);
  const getJsonFromJsonFromUrl = (
    remoteJson: IconIndexOpenDccon | IconIndexBridgeBBCC
  ) => {
    if ("dccons" in remoteJson) {
      logger.debug(`remote json type is IconIndexOpenDccon`);
      return remoteJson.dccons;
    }
    if ("dcConsData" in remoteJson) {
      logger.debug(`remote json type is IconIndexBridgeBBCC`);
      return remoteJson.dcConsData;
    }
    logger.debug(`unknown json type ${remoteJson}`);
    return [];
  };

  const jsonFromFile = localJson;
  const jsonFromUrl = getJsonFromJsonFromUrl(remoteJson);

  // 원격 json파일에서 요소를 제거했을 수도 있으니 같지 않음으로 비교함.
  if (jsonFromUrl.length !== jsonFromFile.length) {
    logger.debug(
      `download new json by different length. local: ${jsonFromFile.length} remote: ${jsonFromUrl.length}`
    );
    return true;
  }

  return false;
};

////////////////////////////////////
export const imageSizeWidth = {
  original: -1,
  large: 100,
  medium: 70,
  small: 40,
};

/**
 * 스트리머 이름을 주면 해당 스트리머의 데이터가 저장된 폴더를 알려줌
 * @param streamerName
 * @returns path-like-string
 */
export const getImageBasePath = () => {
  return resolve(`./images/`);
};

/**
 * 스트리머 이름을 주면 해당 스트리머의 작은 이미지 파일이 저장된 폴더를 알려줌
 * @param streamerName
 * @returns path-like-string
 */
export const getImageSubPaths = () => {
  const basePath = getImageBasePath();
  return {
    original: resolve(basePath, "original"),
    large: resolve(basePath, "large"),
    medium: resolve(basePath, "medium"),
    small: resolve(basePath, "small"),
  };
};
