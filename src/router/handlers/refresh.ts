import { Request, Response } from "express";
import { StreamerData } from "../../@types/interfaces";
import { REFRESH_KEY } from "../../constants";
import IconIndexProcessor from "../../iconIndexProcessor";
import Logger from "../../logger";
import { StreamerListModel } from "../../database";
const logger = Logger(module.filename);

const handler = async (req: Request, res: Response) => {
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

  const streamerData = await StreamerListModel.findOne({ $or: [{name: streamer}, {id: streamer}]});
  if(streamerData === null)
  {
    logger.warn(`${streamer} is not in database`);
    return res.status(404).json({
      status: false,
      message: `Unsupported streamer ${streamer}`,
    });
  }

  const processor = new IconIndexProcessor(streamerData);
  processor.run();    

  return res.status(200).json({
    status: true,
    message: `Now refresh data for ${streamer} at ${Date.now()}. It takes some time...`,
  })
}

export default handler;