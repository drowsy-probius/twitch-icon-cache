import { Request, Response, NextFunction } from "express";
import { resolve, join } from "path";
import fs from "fs";

import { FAILED_LIST_FILE, IMAGE } from "../../constants";
import { IconFunzinnu } from "../../@types/interfaces";

import Logger from "../../logger";
const logger = Logger(module.filename);

const basePath = resolve("./images");

const handler = async (req: Request, res: Response, next: NextFunction) => {
  const streamer = req.params.streamer;
  const image = decodeURI(req.params.image);
  const isSmall = ("small" in req.query);

  const imagePath = join(basePath, streamer, image);
  const imagePathThumbnail = join(basePath, streamer, "thumbnail", image);

  const ext = image.split('.').pop();
  if(ext === undefined || !IMAGE.includes(ext))
  {
    return res.status(404).json({
      status: false,
      message: `That file is not image ${image} -> ${ext}`
    });
  }

  const failedListFile = resolve(`./images/${streamer}/${FAILED_LIST_FILE}`);
  let failedListJson: {[key: string]: IconFunzinnu} = {};
  if(fs.existsSync(failedListFile))
  {
    const failedList = fs.readFileSync(failedListFile, "utf8");
    failedListJson = JSON.parse(failedList);
  }
  const imageName = image.split(".").slice(0, -1).join(".");
  if(imageName in failedListJson)
  {
    return res.status(302).redirect(failedListJson[image].originUri || "/icon");
  }

  if(!fs.existsSync(imagePath))
  {
    return res.status(404).redirect("/icon");
  }

  return isSmall
  ? res.status(200).contentType(`image/${ext}`).sendFile(imagePathThumbnail)
  : res.status(200).contentType(`image/${ext}`).sendFile(imagePath);
}

export default handler;