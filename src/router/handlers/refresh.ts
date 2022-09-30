import { Request, Response, Router } from "express";
import { StreamerData } from "../../@types/interfaces";
import { REFRESH_KEY } from "../../constants";
import IconIndexProcessor from "../../iconIndexProcessor";
import Logger from "../../logger";
import { StreamerListModel } from "../../database";
import { checkStreamerHandler } from "./functions";

const logger = Logger(module.filename);

const router = Router({mergeParams: true});

const refreshHandler = async (req: Request, res: Response) => {
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

  const streamerDoc = res.locals.streamerDoc;
  const processor = new IconIndexProcessor(streamerDoc);
  processor.run();

  return res.status(200).json({
    status: true,
    message: `Now refresh data for ${streamer} at timestamp ${Date.now()}. It takes some time...`,
  })
}

router.get(`/:streamer`, checkStreamerHandler, refreshHandler);

export default router;