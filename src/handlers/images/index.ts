import { Router, Request, Response, NextFunction } from "express";
import { STREAMER_DATA } from "../../data";
import iconListHandler from "./list";
import iconFileHandler from "./file";
import Logger from "../../logger";
const logger = Logger(module.filename);

const router = Router({mergeParams: true});

router.use((req: Request, res: Response, next: NextFunction) => {
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
})
router.get("/", iconListHandler);
router.get("/:filename", iconFileHandler);

export default router;