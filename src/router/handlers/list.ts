import { Router, Request, Response, NextFunction } from "express";
import { resolve } from "path";
import fs from "fs";

import { STREAMER_DATA } from "../../data";
import { INDEX_FILE, IMGPROXY_ENABLE } from "../../constants";
import { getRootFromRequest, createImgproxyUrl } from "../../functions";

import checkStreamer from "./checkStreamer";

const router = Router({mergeParams: true});
const basePath = resolve(".");

const rootHandler = (req: Request, res: Response, next: NextFunction) => {
  return res.status(200).json(STREAMER_DATA);
}

const listHandler = (req: Request, res: Response, next: NextFunction) => {
  const streamer = req.params.streamer;
  const requestedURL = getRootFromRequest(req);
  const jsonPath = resolve(`./images/${streamer}/${INDEX_FILE}`);

  if(!fs.existsSync(jsonPath))
  {
    return res.status(404).json({
      status: false,
      message: `server has not downloaded any data from ${streamer}`
    });
  }

  const data = fs.readFileSync(jsonPath, "utf8");
  const regexp = new RegExp(basePath, "g");
  const uriReplacedData = data.replace(regexp, requestedURL);
  const jsonData = JSON.parse(uriReplacedData);
  if(IMGPROXY_ENABLE)
  {
    for(const icon of jsonData.icons)
    {
      icon.thumbnailUri = createImgproxyUrl(icon.uri, {
        size: 40
      })
      icon.uri = createImgproxyUrl(icon.uri);
      
    }
  }
  return res.status(200).json(jsonData);
}

router.get("/", rootHandler);
router.get("/:streamer", checkStreamer, listHandler);

export default router;