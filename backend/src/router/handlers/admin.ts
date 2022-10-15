import { IconWaitSchema, StreamerSchema } from './../../@types/schemas';
import { readFileSync, unlinkSync } from 'fs';
import { saveIcon } from './../../iconIndexProcessor/functions';
import { Router, Request, Response, NextFunction } from "express";
import { IconInfoListModel, IconListModel, IconWaitListModel, RejectedIconListModel } from "../../database";
import { successResponder, failResponder } from "./functions";
import { HydratedDocument, PopulatedDoc } from 'mongoose';

import Logger from "../../logger";
const logger = Logger(module.filename);

/**
 * 관리자 페이지에서 할 수 있는 일
 * 
 * 아이콘 새로 추가 요청이 발생하면 검토 후 허가 또는 삭제 처리
 * 악성 사용자 차단 -> 이상한 아이콘을 n회 이상 업로드 한 경우
 * 데이터베이스를 볼 수 있으면 편할 듯
 * 
 * twitch oauth로 로그인 할 때 사용자 아이디와 데이터베이스에 저장된 관리자 값과 비교해서
 * 관리자 권한인지 확인함.
 * 
 * 검토 로직을 이미지 업로드 요청이 왔을 때 
 * 서버에서 디스코드나 텔레그램으로 알림을 주고 버튼을 눌러서 처리하도록 하면 
 * 검토 로직은 훨씬 편해지고 임시 이미지 데이터가 서버에 쌓여있을 일도 없을 듯.
 * 다만 개발 비용은 조금...
 * 
 * 
 * resolve, reject 수행할 때 로컬에 저장되었던
 * 임시 이미지 삭제해야함.
 * 
 */

const adminCheckHandler = async (req: Request, res: Response, next: NextFunction) => {
  // TODO
  console.log("admin");
  next();
}

const getIconWaitDocFromObjectId = async (req: Request, res: Response, next: NextFunction) => {
  const objectId = req.params.objectId;
  const iconWaitDoc = await IconWaitListModel.findOne({ _id: objectId }).populate<{uploader: StreamerSchema}>('uploader');
  // popluate에 타입을 지정해줘야 해당 부분에서 타입오류가 나지 않음.
  if(iconWaitDoc === null)
  {
    return failResponder(res, `${iconWaitDoc} does not in database`);
  }
  res.locals.iconWaitDoc = iconWaitDoc;
  next();
}


const iconListHandler = async (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 50;
  const offset = Number(req.query.offset) || 0;

  const iconWaitDocs = await IconWaitListModel.find().skip(offset).limit(limit);
  return res.status(200).json(iconWaitDocs);
}

const iconResolveHandler = async (req: Request, res: Response) => {
  const iconWaitDoc = res.locals.iconWaitDoc as HydratedDocument<IconWaitSchema> & { uploader: StreamerSchema };

  logger.debug(`${iconWaitDoc.uploader.name}(${iconWaitDoc.uploader.nickname}) added ${iconWaitDoc.iconKeywords}`);
  const iconInfo = {
    keywords: iconWaitDoc.iconKeywords,
    name: iconWaitDoc.iconName,
    tags: iconWaitDoc.iconTags,
    useOrigin: false,
    originPath: '',
  }
  await saveIcon(
    readFileSync(iconWaitDoc.path),
    {
      iconHash: iconWaitDoc.hash,
      ...iconInfo
    },
    iconWaitDoc.uploader.name,
    logger
  );

  const iconDoc = await IconListModel.findOne({ iconHash: iconWaitDoc.hash });
  if(iconDoc === null)
  {
    return failResponder(res, `${iconWaitDoc} database error`);
  }
  await IconInfoListModel.create({
    owner: iconWaitDoc.uploader,
    icon: iconDoc,
    ...iconInfo
  });

  unlinkSync(iconWaitDoc.path);
  await IconWaitListModel.deleteOne({ _id: iconWaitDoc._id });
  
  return successResponder(res, "upload");
}

const iconRejectHandler = async (req: Request, res: Response) => {
  const iconWaitDoc = res.locals.iconWaitDoc as HydratedDocument<IconWaitSchema> & { uploader: StreamerSchema };
  unlinkSync(iconWaitDoc.path);
  await IconWaitListModel.deleteOne({ _id: iconWaitDoc._id });
  await RejectedIconListModel.create({
    ...iconWaitDoc.toJSON()
  });
  return successResponder(res, "reject");
}

const iconReportHandler = async (req: Request, res: Response) => {
  const iconWaitDoc = res.locals.iconWaitDoc as HydratedDocument<IconWaitSchema> & { uploader: StreamerSchema };
}

const banStreamerHandler = async (req: Request, res: Response) => {
  const streamerName = req.params.streamerName;
}


const router = Router({mergeParams: true}).use(adminCheckHandler);
router.get('/icon/queue', iconListHandler);
router.get('/icon/:objectId/resolve', getIconWaitDocFromObjectId, iconResolveHandler);
router.get('/icon/:objectId/reject', getIconWaitDocFromObjectId, iconRejectHandler);
router.get('/icon/:objectId/report', getIconWaitDocFromObjectId, iconReportHandler);

router.get('/ban/:streamerName', banStreamerHandler);

export default router;