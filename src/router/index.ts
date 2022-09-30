import { Router } from "express";
import {
  imageHandler,
  listHandler,
  rootHandler,
  refreshHandler,
  searchHandler,
  iconHandler,
} from "./handlers";

const router = Router();

router.get("/", rootHandler);

/**
 * `/list`에는 서브 디렉토리가 있으니 `listHandler`는 express.Router로 만들어졌음.
 */
router.use("/list", listHandler);
router.use("/images", imageHandler);
router.use("/icon", iconHandler);

/**
 * `checkStreamer`는 요청한 스트리머가 유효한 것인지 확인하는 미들웨어임.
 */
router.use("/refresh", refreshHandler);

/**
 * 키워드 값이 들어올 때 해당되는 주소 리턴하는 것
 * 추후 확장성을 위해서 검색 api가 있는 것이 좋다고 생각함.
 */
router.use("/search", searchHandler);

export default router;
