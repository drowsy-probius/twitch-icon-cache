import { Router } from "express";
import { 
  imageHandler, 
  listHandler, 
  rootHandler, 
  checkStreamer, 
  iconHandler 
} from "./handlers";

const router = Router();
router.get("/", rootHandler);
router.use("/list", listHandler);
router.get("/images/:streamer/:image", checkStreamer, imageHandler);
router.get("/icon/:streamer/:size", checkStreamer, iconHandler);

export default router;