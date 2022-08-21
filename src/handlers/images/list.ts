import { Request, Response, NextFunction } from "express";
import { resolve } from "path";
import { INDEX_FILE } from "../../constants";
import fs from "fs";

import Logger from "../../logger";
const logger = Logger(module.filename);
const basePath = resolve(".");

const handler = (req: Request, res: Response, next: NextFunction) => {
  const streamer = req.params.streamer;
  // const requestedURL = `${req.protocol}://${req.get("Host")}${req.originalUrl}`;
  const requestedURL = `${req.protocol}://${req.get("Host")}`;
  const jsonPath = resolve(`./images/${streamer}/${INDEX_FILE}`);

  if(!fs.existsSync(jsonPath))
  {
    return res.status(404).json({
      status: false,
      message: `server has not downloaded any data from ${streamer}`
    });
  }

  try 
  {
    const data = fs.readFileSync(jsonPath, "utf8");
    const regexp = new RegExp(basePath, "g");
    const uriReplacedData = data.replace(regexp, requestedURL);
    return res.status(200).json(JSON.parse(uriReplacedData));
  }
  catch(err)
  {
    return res.status(404).json({
      status: false,
      message: `${err}`
    });
  }
}

export default handler;