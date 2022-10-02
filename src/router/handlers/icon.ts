import { createHash } from "crypto";
import { NextFunction, Request, Response, Router } from "express";
import multer from "multer";
import {
  StreamerListModel,
  IconInfoListModel,
  IconListModel,
} from "../../database";
import { isStringArray } from "./functions";
import { saveIcon } from "../../iconIndexProcessor/functions";
import Logger from "../../logger";

const router = Router({ mergeParams: true });

/**
 * <form action="/icon/upload" enctype="multipart/form-data" method="post">
 *    <input type="file" name="icon">
 */
const filesizeLimit = multer({
  limits: {
    fieldSize: 2 * 1024 * 1024, // 2MB
    fileSize: 2 * 1024 * 1024,
  },
  storage: multer.memoryStorage(),
});

const loginCheckHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // TODO
  next();
};

/**
 * uploader
 * name
 * tags
 * keywords
 * icon
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
  const buffer = req.file?.buffer;
  if (buffer === undefined) return errorSender(`buffer is undefined`);
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
  let iconDoc = await IconListModel.findOne({ iconHash: iconHash });
  if (iconDoc === null) {
    // 새로운 이미지라면 로컬에 저장하고 db에 추가한다.
    logger.debug(`${uploader} ${keywords} new icon added`);
    await saveIcon(
      buffer,
      {
        iconHash: iconHash,
        keywords: keywords,
        name: name,
        tags: tags,
        useOrigin: false,
        originPath: "",
      },
      uploader,
      logger
    );
    iconDoc = await IconListModel.findOne({ iconHash: iconHash });
  }
  if (iconDoc === null) return errorSender(`database error`);
  // 아이콘 목록에서 usedBy가 제대로 처리되지 않았을 때 에러
  if(!iconDoc.usedBy.includes(streamerDoc._id)) return errorSender(`iconList usedBy reference error`);

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
  loginCheckHandler,
  filesizeLimit.single("icon"),
  uploadHandler
);
router.post(
  "/update",
  loginCheckHandler,
  filesizeLimit.single("icon"),
  updateHandler
);
router.post("/delete", loginCheckHandler, deleteHandler);

export default router;
