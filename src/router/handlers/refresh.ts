import { Request, Response } from 'express';
import { REFRESH_KEY } from '../../constants';
import Logger from '../../Logger';
import { run_refreshTask } from '../../background/parent';
const logger = Logger(module.filename);

const handler = (req: Request, res: Response) => {
  const secretkey = req.query.key;
  const streamer: string = req.params.streamer;

  if (secretkey !== REFRESH_KEY) {
    logger.warn(`${secretkey} is not allowed`);
    return res.status(401).json({
      status: false,
      message: `Unauthorized request. ${secretkey} does not match to server's one.`,
    });
  }

  run_refreshTask(streamer);

  return res.status(200).json({
    status: true,
    message: `Now refresh data for ${streamer} at ${Date.now()}. It takes some time...`,
  });
};

export default handler;
