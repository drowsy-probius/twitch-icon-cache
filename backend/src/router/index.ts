import { Router } from "express";
import listHandler from "./handlers/list";
import imageHandler from "./handlers/image";
import iconHandler from "./handlers/icon";
import refreshHandler from "./handlers/refresh";
import searchHandler from "./handlers/search";
import adminHandler from "./handlers/admin";
import cdnHandler from "./handlers/cdn";

const router = Router();

/**
 * `/list`에는 서브 디렉토리가 있으니 `listHandler`는 express.Router로 만들어졌음.
 */
router.use("/list", listHandler);
router.use("/image", imageHandler);
router.use("/icon", iconHandler);


/**
 * 캐시서버 (cdn)을 거치는 주소
 */
router.use("/cdn", cdnHandler);

/**
 * back
 */
router.use("/admin", adminHandler);

router.use("/refresh", refreshHandler);

/**
 * 키워드 값이 들어올 때 해당되는 주소 리턴하는 것
 * 추후 확장성을 위해서 검색 api가 있는 것이 좋다고 생각함.
 */
router.use("/search", searchHandler);

export default router;
