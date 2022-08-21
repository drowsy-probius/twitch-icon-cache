import { Router } from "express";
import { iconHandler, listHandler, rootHandler } from "./handlers";

const router = Router();
router.get("/", rootHandler);
router.get("/list", listHandler);
router.use("/images/:streamer", iconHandler);

export default router;