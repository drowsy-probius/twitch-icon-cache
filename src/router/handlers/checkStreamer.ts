import { Request, Response, NextFunction } from "express";
import { STREAMER_DATA } from "../../data";

const handler = (req: Request, res: Response, next: NextFunction) => {
  const streamer = req.params.streamer;
  let isStreamerExists = false;
  for(const DATA of STREAMER_DATA)
  {
    if(DATA.name === streamer)
    {
      isStreamerExists = true;
      break;
    }
  }
  if(!isStreamerExists)
  {
    return res.status(404).json({
      status: false,
      message: `${streamer} not supported`
    });
  }
  next();
}

export default handler;