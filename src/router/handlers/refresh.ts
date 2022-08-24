import { Request, Response, NextFunction } from "express";
import { StreamerData } from "../../@types/interfaces";
import { REFRESH_KEY } from "../../constants";
import { STREAMER_DATA } from "../../data";
import processorFunctions from "../../iconProcessor";
import Logger from "../../logger";
const logger = Logger(module.filename);

const handler = (req: Request, res: Response, next: NextFunction) => {
  const secretkey = req.query.key;
  const streamer: string = req.params.streamer;
  
  if(secretkey !== REFRESH_KEY)
  {
    logger.warn(`${secretkey} is not allowed`);
    return res.status(401).json({
      status: false,
      message: `Unauthorized request. ${secretkey} does not match to server's one.`,
    })
  }

  const isValidStreamer = streamer in processorFunctions;
  if(!isValidStreamer)
  {
    return res.status(404).json({
      status: false,
      message: `No such streamer: ${streamer}`,
    })
  }
  const streamerData: StreamerData = STREAMER_DATA.filter(d => d.name === streamer)[0];
  processorFunctions[streamer](streamerData);

  return res.status(200).json({
    status: true,
    message: `Now refresh data for ${streamer} at ${Date.now()}. It takes some time...`,
  })
}

export default handler;