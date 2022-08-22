import { Request, Response, NextFunction } from "express";
import { resolve, join } from "path";
import { FAILED_LIST_FILE } from "../../constants";
import fs from "fs";

import { IMAGE } from "../../constants";

import Logger from "../../logger";
import { resizeImage } from "../../functions";
const logger = Logger(module.filename);

const basePath = resolve("./images")

const handler = async (req: Request, res: Response, next: NextFunction) => {
  const streamer = req.params.streamer;
  const image = decodeURI(req.params.image);
  const size = req.query.size;

  const imagePath = join(basePath, streamer, image);

  const ext = image.split('.').pop();
  if(ext === undefined || !IMAGE.includes(ext))
  {
    return res.status(404).json({
      status: false,
      message: `That file is not image ${image} -> ${ext}`
    });
  }

  const failedList = fs.readFileSync(
    resolve(`./images/${streamer}/${FAILED_LIST_FILE}`),
    "utf8"
  );
  const failedListJson = JSON.parse(failedList);
  if(image.split(".").slice(0, -1).join(".") in failedListJson)
  {
    return res.status(302).redirect(failedListJson[image].originUri);
  }


  if(!fs.existsSync(imagePath))
  {
    return res.status(404).json({
      status: false,
      message: `there is no image for ${streamer}/${image}`
    });
  }

  if(size !== undefined)
  {
    try 
    {
      const buffer = await resizeImage(imagePath, Number(size));
      return res.status(200).contentType(`image/${ext}`).send(buffer);
    }
    catch(err)
    {
      logger.error(err);
      return res.status(400).json({
        status: false,
        message: `bad image resize option ${image} ${size}`
      });
    }
  }

  return res.status(200).contentType(`image/${ext}`).sendFile(imagePath);
}

export default handler;