import { NextFunction, Request, Response, Router } from "express";
import multer from "multer";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import {
  StreamerListModel,
  IconInfoListModel,
  IconListModel,
  IconWaitListModel,
  RejectedIconListModel,
} from "../../database";
import { 
  isStringArray,
  successResponder,
  failResponder,
} from "./functions";
import { saveIcon } from "../../iconIndexProcessor/functions";
import { 
  getTempPath,
} from "../../functions";
import { IMAGE } from "../../constants";
import Logger from "../../logger";

const TEMP_PATH = getTempPath();
const IMAGE_REGEX = new RegExp(IMAGE.map(ext => ext.slice(1)).join("|"));

const imageTypeCheckerByName = (name: string) => IMAGE_REGEX.test(name);

/**
 * <form action="/icon/upload" enctype="multipart/form-data" method="post">
 *    <input type="file" name="icon">
 * 
 * 
 * tmp폴더에 일단 저장되도록 설정 함.
 */
const filesizeLimit = multer({
  limits: {
    fieldSize: 1 * 1024 * 1024, // 2MB
    fileSize: 1 * 1024 * 1024,
  },
  dest: TEMP_PATH,
  fileFilter: function(req, file, cb){
    if(imageTypeCheckerByName(file.mimetype))
    {
      return cb(null, true);
    }
    cb(null, false);
    return cb(new Error(`allowed image types: ${IMAGE}`));
  }
});

const loginCheckHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // TODO
  console.log("login");
  next();
};

/**
 * uploader
 * name
 * tags
 * keywords
 * icon
 * 
 * 사용자가 아이콘을 업로드함.
 * 근데 바로 사용가능하도록 하면 안됨. 이상한 이미지가 올라갈 수 있으니 검토하는 과정이 필요하다.
 * 
 * 임시 아이콘 데이터베이스에 추가한 뒤에 관리자가 허가하면
 * iconList, iconInfo 데이터베이스에 저장될 것임.
 * 
 * 그 이전에 업로드 된 이미지 버퍼는 어디에 있어야 하는가
 * 로컬에 저장하기에는 찝찝함이 있음.
 * 그렇다고 이미지 하나에 최대 1MB로 설정했는데 데이터베이스에 넣는다 하면 너무 커질 수 있음. 
 *
 * @param req
 * @param res
 * @returns
 */
const uploadHandler = async (req: Request, res: Response) => {
  const logger = Logger(`${module.filename}:[uploadHandler]`);

  logger.silly(req.body);
  /**
   * req.file
   * {
   *  "fieldname":"icon",
   *  "originalname":"1356106.jpg",
   *  "encoding":"7bit",
   *  "mimetype":"image/jpeg",
   *  "destination":"/config/workspace/twitch-icon-cache/tmp",
   *  "filename":"1984a8130becfc78789091c735bd6e56",
   *  "path":"/config/workspace/twitch-icon-cache/tmp/1984a8130becfc78789091c735bd6e56",
   *  "size":282499
   * }
   */
  // type checker
  if(req.file === undefined) return failResponder(res, `file required`);
  const buffer = readFileSync(req.file.path);
  const _uploader = req.body.uploader;
  const _name = req.body.name;
  const _tags = req.body.tags;
  const _keywords = req.body.keywords;
  if (typeof _name !== "string") return failResponder(res, `name type error`);
  if (!isStringArray(_tags)) return failResponder(res, `tags type error`);
  if (!isStringArray(_keywords)) return failResponder(res, `keywords type error`);
  if (typeof _uploader !== "string") return failResponder(res, `uploader type error`);

  const uploader = _uploader as string;
  const name = _name as string;
  const tags = _tags as string[];
  const keywords = _keywords as string[];
  const iconHash = createHash("sha256").update(buffer).digest("hex");
  if (name.length === 0) return failResponder(res, `name is empty`);
  if (keywords.length === 0) return failResponder(res, `keyword is empty`);
  if (uploader.length === 0) return failResponder(res, `uploader is empty`);
  if (tags.length === 0) tags.push("미지정");

  // check denylist
  const rejectedIconDoc = await RejectedIconListModel.findOne({ hash: iconHash });
  if(rejectedIconDoc !== null)
  {
    return failResponder(res, `this icon is in our denylist`);
  }

  // db checker
  const streamerDoc = await StreamerListModel.findOne({ name: uploader });
  if (streamerDoc === null) return failResponder(res, `uploader does not exists`);
  const nameConflict = await IconInfoListModel.findOne({
    owner: streamerDoc._id,
    name: name,
  });
  if (nameConflict !== null) return failResponder(res, `duplicated icon name`);
  const keywordsConflict = await IconInfoListModel.findOne({
    owner: streamerDoc._id,
    keywords: { $in: keywords },
  });
  if (keywordsConflict !== null) return failResponder(res, `duplicated icon keywords`);

  // insert to database
  // 동일한 이미지가 존재하는지 확인
  const iconDoc = await IconListModel.findOne({ iconHash: iconHash });
  if(iconDoc !== null) // 이미 이미지가 존재한다면 관리자가 검토하지 않음.
  {
    // 스트리머 목록에 항목을 추가한다.
    await IconInfoListModel.create({
      owner: streamerDoc._id,
      icon: iconDoc._id,
      name: name,
      tags: tags,
      keywords: keywords,

      useOrigin: false,
      originPath: "",
    });

    return successResponder(res, "upload");
  }


  /**
   * 업로드 한 이미지가 새 이미지인 경우에는 원본을 tmp폴더에 저장한 뒤 (미들웨어가 수행)
   * iconWait db에 추가하고 관리자의 승인을 기다림.
   * 이미지가 승인이 되면 IconInfoListModel에 항목을 추가해야 함.
   */
  logger.debug(`${uploader} ${keywords} new icon requested`);
  await IconWaitListModel.create({
    ...req.file,
    uploader: streamerDoc._id,
    hash: iconHash,
    iconName: name,
    iconKeywords: keywords,
    iconTags: tags,
  });
  return successResponder(res, "wait");
};

const updateHandler = (req: Request, res: Response) => {
  return successResponder(res, "update");
};

const deleteHandler = (req: Request, res: Response) => {
  return successResponder(res, "delete");
};

const router = Router({ mergeParams: true }).use(loginCheckHandler);

router.post(
  "/upload",
  filesizeLimit.single("icon"),
  uploadHandler
);
router.post(
  "/update",
  filesizeLimit.single("icon"),
  updateHandler
);
router.post(
  "/delete", 
  deleteHandler
);

export default router;
