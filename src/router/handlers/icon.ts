import { NextFunction, Request, Response, Router } from "express";
import multer from "multer";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import {
  StreamerListModel,
  IconInfoListModel,
  IconListModel,
  IconWaitListModel,
} from "../../database";
import { isStringArray } from "./functions";
import { saveIcon } from "../../iconIndexProcessor/functions";
import { 
  getTempPath,
} from "../../functions";
import { IMAGE } from "../../constants";
import Logger from "../../logger";

const router = Router({ mergeParams: true });
const TEMP_PATH = getTempPath();
const IMAGE_REGEX = new RegExp(IMAGE.map(ext => ext.slice(1)).join("|"));

const imageTypeCheckerByName = (name: string) => IMAGE_REGEX.test(name);

/**
 * <form action="/icon/upload" enctype="multipart/form-data" method="post">
 *    <input type="file" name="icon">
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
  const errorSender = (message: string) => {
    return res.status(400).json({
      status: false,
      message: message,
    });
  };

  logger.silly(req.body);
  // type checker

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
  if(req.file === undefined) return errorSender(`file required`);
  const buffer = readFileSync(req.file.path);
  const _uploader = req.body.uploader;
  const _name = req.body.name;
  const _tags = req.body.tags;
  const _keywords = req.body.keywords;
  if (typeof _name !== "string") return errorSender(`name type error`);
  if (!isStringArray(_tags)) return errorSender(`tags type error`);
  if (!isStringArray(_keywords)) return errorSender(`keywords type error`);
  if (typeof _uploader !== "string") return errorSender(`uploader type error`);

  const uploader = _uploader as string;
  const name = _name as string;
  const tags = _tags as string[];
  const keywords = _keywords as string[];
  const iconHash = createHash("sha256").update(buffer).digest("hex");
  if (name.length === 0) return errorSender(`name is empty`);
  if (keywords.length === 0) return errorSender(`keyword is empty`);
  if (uploader.length === 0) return errorSender(`uploader is empty`);
  if (tags.length === 0) tags.push("미지정");

  // db checker
  const streamerDoc = await StreamerListModel.findOne({ name: uploader });
  if (streamerDoc === null) return errorSender(`uploader does not exists`);
  const nameConflict = await IconInfoListModel.findOne({
    owner: streamerDoc._id,
    name: name,
  });
  if (nameConflict !== null) return errorSender(`duplicated icon name`);
  const keywordsConflict = await IconInfoListModel.findOne({
    owner: streamerDoc._id,
    keywords: { $in: keywords },
  });
  if (keywordsConflict !== null) return errorSender(`duplicated icon keywords`);

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

    return res.status(200).json({
      status: true,
      message: "upload"
    });
  }

  // 새로운 이미지 업로드일 경우에는 iconWait db에 추가함.
  logger.debug(`${uploader} ${keywords} new icon requested`);
  await IconWaitListModel.create({
    ...req.file,
    uploader: streamerDoc._id,
    hash: iconHash,
    iconName: name,
    iconKeywords: keywords,
    iconTags: tags,
  });

  // if (iconDoc === null) {
  //   // 새로운 이미지라면 로컬에 저장하고 db에 추가한다.
  //   logger.debug(`${uploader} ${keywords} new icon added`);
  //   await saveIcon(
  //     buffer,
  //     {
  //       iconHash: iconHash,
  //       keywords: keywords,
  //       name: name,
  //       tags: tags,
  //       useOrigin: false,
  //       originPath: "",
  //     },
  //     uploader,
  //     logger
  //   );
  //   iconDoc = await IconListModel.findOne({ iconHash: iconHash });
  // }
  // if (iconDoc === null) return errorSender(`database error`);
  // // 아이콘 목록에서 usedBy가 제대로 처리되지 않았을 때 에러
  // if(!iconDoc.usedBy.includes(streamerDoc._id)) return errorSender(`iconList usedBy reference error`);

  
  return res.status(200).json({
    status: true,
    message: "wait"
  });
};

const updateHandler = (req: Request, res: Response) => {
  return res.status(200).json({
    status: true,
    message: "update",
  });
};

const deleteHandler = (req: Request, res: Response) => {
  return res.status(200).json({
    status: true,
    message: "delete",
  });
};

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

export default router.use(loginCheckHandler);
