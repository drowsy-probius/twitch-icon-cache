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
router.use("/list", listHandler);
router.get("/images/:streamer/:image", checkStreamer, imageHandler);
router.get("/icon", iconHandler);
router.get("/refresh/:streamer", refreshHandler);

export default router;