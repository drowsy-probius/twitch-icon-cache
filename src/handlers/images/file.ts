import { Request, Response, NextFunction } from "express";
import { resolve, join } from "path";
import { FAILED_LIST_FILE } from "../../constants";
import fs from "fs";

import { IMAGE } from "../../constants";

import Logger from "../../logger";
const logger = Logger(module.filename);

const basePath = resolve("./images")

const handler = (req: Request, res: Response, next: NextFunction) => {
  const streamer = req.params.streamer;
  const filename = req.params.filename;
  const imagePath = join(basePath, streamer, filename);

  const ext = filename.split('.').pop();
  if(ext === undefined || !IMAGE.includes(ext))
  {
    return res.status(404).json({
      status: false,
      message: `That file is not image`
    });
  }

  if(filename.startsWith('.') || filename.indexOf('/') !== -1 || filename.indexOf('\\') !== -1)
  {
    return res.status(404).json({
      status: false,
      message: `DO NOT HACKING!!!`
    });
  }

  const failedList = fs.readFileSync(
    resolve(`./images/${streamer}/${FAILED_LIST_FILE}`),
    "utf8"
  );
  const failedListJson = JSON.parse(failedList);
  if(filename in failedListJson)
  {
    return res.status(302).redirect(failedListJson[filename].origin_uri);
  }


  if(!fs.existsSync(imagePath))
  {
    return res.status(404).json({
      status: false,
      message: `there is no image for ${streamer}/${filename}`
    });
  }

  return res.sendFile(imagePath);
}

export default handler;