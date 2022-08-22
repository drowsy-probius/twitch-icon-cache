import { Router } from "express";
import { imageHandler, listHandler, rootHandler, checkStreamer } from "./handlers";

const router = Router();
router.get("/", rootHandler);
router.use("/list", listHandler);
router.get("/images/:streamer/:image", checkStreamer, imageHandler);

export default router;