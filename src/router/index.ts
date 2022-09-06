import { Router } from "express";
import { 
  imageHandler, 
  listHandler, 
  rootHandler, 
  checkStreamer, 
  iconHandler,
  refreshHandler,
} from "./handlers";

const router = Router();

router.get("/", rootHandler);

/**
 * `/list`에는 서브 디렉토리가 있으니 `listHandler`는 express.Router로 만들어졌음.
 */
router.use("/list", listHandler);

/**
 * `checkStreamer`는 요청한 스트리머가 유효한 것인지 확인하는 미들웨어임.
 */
router.get("/images/:streamer/:image", checkStreamer, imageHandler);

router.get("/icon", iconHandler);

/**
 * `checkStreamer`는 요청한 스트리머가 유효한 것인지 확인하는 미들웨어임.
 */
router.get("/refresh/:streamer", checkStreamer, refreshHandler);

export default router;