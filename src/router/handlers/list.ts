import { Router, Request, Response, NextFunction } from "express";
import { resolve } from "path";
import fs from "fs";

import { STREAMER_DATA } from "../../data";
import { INDEX_FILE } from "../../constants";
import { getRootFromRequest } from "../../functions";

import checkStreamer from "./checkStreamer";
import { IconIndex } from "../../@types/interfaces";

const router = Router({mergeParams: true});
const basePath = resolve(".");

const rootHandler = (req: Request, res: Response, next: NextFunction) => {
  return res.status(200).json(STREAMER_DATA);
}

const listHandler = (req: Request, res: Response, next: NextFunction) => {
  const streamer = req.params.streamer;
  const timestamp = Number(req.query.ts || 0);  
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
  const jsonData: IconIndex = JSON.parse(uriReplacedData);
  if(timestamp === jsonData.timestamp)
  {
    return res.status(200).json({
      status: false,
      message: `your data is not outdated.`
    })
  }

  return res.status(200).json(jsonData);
}

const originListHandler = (req: Request, res: Response, next: NextFunction) => {
  const streamer = req.params.streamer;
  const jsonPath = resolve(`./images/${streamer}/${INDEX_FILE}`);
  const data = fs.readFileSync(jsonPath, "utf8");
  const jsonData: IconIndex = JSON.parse(data);
  const replacedData = {
    dccons: [
      ...jsonData.icons
    ],
    timestamp: jsonData.timestamp
  }

  return res.status(200).json(replacedData);
}

router.get("/", rootHandler);
router.get("/:streamer", checkStreamer, listHandler);
router.get("/open-dccon/:streamer", checkStreamer, originListHandler);

export default router;