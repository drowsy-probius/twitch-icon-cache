import { Router, Request, Response } from "express";
import { resolve, join } from "path";
import fs from "fs";

import { STREAMER_DATA } from "../../data";
import { INDEX_FILE } from "../../constants";
import { getImageBasePath } from "../../functions";
import Logger from "../../Logger";

import checkStreamerWrapper from "./checkStreamerWrapper";
import {
  IconIndex,
  IconIndexFormat,
  STREAM_PLATFORM,
  StreamPlatform,
} from "../../@types/interfaces";
import {
  convertIconIndexToChatAssistX,
  convertIconIndexToOpenDccon,
  convertToTwitchName,
  getIconIndexByTwitch,
} from "../../services/icons";

const logger = Logger(module.filename);
const router = Router({ mergeParams: true });
const basePath = resolve(".");

/**
 * 현재 서버에 어떤 스트리머를 지원하는지 보여줌.
 * 스트리머 이름, 아이콘 정보를 제공하는 원본 url 을 알려준다.
 */
const rootHandler = (req: Request, res: Response) => {
  return res.status(200).json(STREAMER_DATA);
};

/**
 * parameter로 받은 스트리머에 해당하는 아이콘 목록 json을 리턴함.
 * parameter에 `ts`값이 있다면
 * 서버에 저장된 아이콘 목록 json의 timestamp 값과 비교하여
 * parameter의 ts 값이 다르다면 아이콘 목록 json을 리턴하고
 * 아니라면 상태 메시지 json을 리턴함.
 */
const listHandlerWrapper = (iconIndexFormat: IconIndexFormat) => {
  let iconIndexConverter: (a: IconIndex) => unknown;

  switch (iconIndexFormat) {
    case "brigebbcc": {
      iconIndexConverter = (a: IconIndex) => a;
      break;
    }
    case "opendccon": {
      iconIndexConverter = convertIconIndexToOpenDccon;
      break;
    }
    case "chatassistx": {
      iconIndexConverter = convertIconIndexToChatAssistX;
      break;
    }
  }

  return (req: Request, res: Response) => {
    const streamer = req.params.streamer;

    try {
      const iconIndex = getIconIndexByTwitch(streamer);

      if (iconIndexFormat === "chatassistx") {
        return res.status(200).send(iconIndexConverter(iconIndex));
      }
      return res.status(200).json(iconIndexConverter(iconIndex));
    } catch (e) {
      logger.warn(e);
      return res.status(404).json({
        status: false,
        message: (e as unknown as Error).message,
      });
    }
  };
};

/**
 * query string으로 받은 스트리머 이름 1개로
 * 일치하는 아이콘 목록 리턴
 *
 * 파싱 우선순위
 * 트위치 > 치지직 > 유튜브
 *
 * @param req
 * @param res
 */
const multiplatformListHandlerWrapper = (iconIndexFormat: IconIndexFormat) => {
  let iconIndexConverter: (a: IconIndex) => unknown;
  switch (iconIndexFormat) {
    case "brigebbcc": {
      iconIndexConverter = (a: IconIndex) => a;
      break;
    }
    case "opendccon": {
      iconIndexConverter = convertIconIndexToOpenDccon;
      break;
    }
    case "chatassistx": {
      iconIndexConverter = convertIconIndexToChatAssistX;
      break;
    }
  }

  return (req: Request, res: Response) => {
    const queries = req.query;
    const platform = queries["platform"];
    const streamer = queries["streamer"];

    if (
      typeof platform !== "string" ||
      typeof streamer !== "string" ||
      !(STREAM_PLATFORM as readonly string[]).includes(platform)
    ) {
      return res.status(400).json({
        status: false,
        message: "invalid query parameters",
      });
    }

    try {
      const iconIndex = getIconIndexByTwitch(
        convertToTwitchName(platform as StreamPlatform, streamer)
      );
      if (iconIndexFormat === "chatassistx") {
        return res.status(200).send(iconIndexConverter(iconIndex));
      }
      return res.status(200).json(iconIndexConverter(iconIndex));
    } catch (e) {
      logger.warn(e);
      return res.status(404).json({
        status: false,
        message: (e as unknown as Error).message,
      });
    }
  };
};

router.get("/", rootHandler);

router.get("/by", multiplatformListHandlerWrapper("brigebbcc"));
router.get("/:streamer", checkStreamerWrapper("twitch"), listHandlerWrapper("brigebbcc"));

router.get("/open-dccon/by", multiplatformListHandlerWrapper("opendccon"));
router.get(
  "/open-dccon/:streamer",
  checkStreamerWrapper("twitch"),
  listHandlerWrapper("opendccon")
);

router.get("/chatassistx/by", multiplatformListHandlerWrapper("chatassistx"));
router.get(
  "/chatassistx/:streamer",
  checkStreamerWrapper("twitch"),
  listHandlerWrapper("chatassistx")
);

export default router;