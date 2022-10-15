import { Router, Request, Response, NextFunction } from "express";
import { IconInfoSchema, IconSchema } from "./../../@types/schemas";
import { resolve } from "path";

import { DOMAIN } from "../../constants";
import { getImageBasePath } from "../../functions";

import { checkStreamerHandler } from "./functions";
import { IconIndex } from "../../@types/interfaces";
import {
  StreamerListModel,
  IconInfoListModel,
  IconListModel,
} from "../../database";
import Logger from "../../logger";
const logger = Logger(module.filename);

const imageDirectory = "api/image";

/**
 * 현재 서버에 어떤 스트리머를 지원하는지 보여줌.
 * 스트리머 이름, 아이콘 정보를 제공하는 원본 url 을 알려준다.
 */
const rootHandler = async (req: Request, res: Response) => {
  const streamerData = await StreamerListModel.find().select(
    "id name nickname lastUpdateDate -_id"
  );
  return res.status(200).json(streamerData);
};

const streamerIconsListHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const streamerDoc = res.locals.streamerDoc;
  const iconInfoDocs = await IconInfoListModel.find({ owner: streamerDoc._id })
    .select("icon name tags keywords -_id")
    .populate<{ icon: IconSchema }>("icon");
  res.locals.streamerIconList = iconInfoDocs;
  next();
};

/**
 * parameter로 받은 스트리머에 해당하는 아이콘 목록 json을 리턴함.
 * parameter에 `ts`값이 있다면
 * 서버에 저장된 아이콘 목록 json의 timestamp 값과 비교하여
 * parameter의 ts 값이 다르다면 아이콘 목록 json을 리턴하고
 * 아니라면 상태 메시지 json을 리턴함.
 */
const listHandler = async (req: Request, res: Response) => {
  const iconInfoDocs = res.locals.streamerIconList;
  const icons = iconInfoDocs.map((iconInfoDoc: IconInfoSchema) => {
    const icon = iconInfoDoc.icon as IconSchema;
    return {
      name: iconInfoDoc.name,
      tags: iconInfoDoc.tags,
      keywords: iconInfoDoc.keywords,
      path: `${DOMAIN}/${imageDirectory}/${icon.iconHash}`,
    };
  });
  return res.status(200).json(icons);
};

/**
 * open dccon 포맷으로 서버의 json을 보여줌.
 * {
 *   dccons: []
 * }
 * 이런 형식을 가짐.
 */
const openDcconListHandler = (req: Request, res: Response) => {
  const iconInfoDocs = res.locals.streamerIconList;
  const icons = iconInfoDocs.map((iconInfoDoc: IconInfoSchema) => {
    const icon = iconInfoDoc.icon as IconSchema;
    return {
      name: iconInfoDoc.name,
      tags: iconInfoDoc.tags,
      keywords: iconInfoDoc.keywords,
      path: `${DOMAIN}/${imageDirectory}/${icon.iconHash}`,
    };
  });
  return res.status(200).json(icons);
};

const bridgebbccListHandler = (req: Request, res: Response) => {
  const iconInfoDocs = res.locals.streamerIconList;
  const icons = iconInfoDocs.map((iconInfoDoc: IconInfoSchema) => {
    const icon = iconInfoDoc.icon as IconSchema;
    return {
      name: iconInfoDoc.name,
      tags: iconInfoDoc.tags,
      keywords: iconInfoDoc.keywords,
      uri: `${DOMAIN}/${imageDirectory}/${icon.iconHash}`,
    };
  });
  return res.status(200).json(icons);
};

const router = Router({ mergeParams: true });
const streamerValidatedRouter = Router({ mergeParams: true }).use(checkStreamerHandler, streamerIconsListHandler);

streamerValidatedRouter.get(
  "/",
  listHandler
);
streamerValidatedRouter.get(
  "/opendccon",
  openDcconListHandler
);
streamerValidatedRouter.get(
  "/bridgebbcc",
  bridgebbccListHandler
);

router.get("/", rootHandler);
router.use("/:streamer", streamerValidatedRouter);

export default router;
