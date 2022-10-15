import { Router } from "express";
import rootHandler from "./handlers/root";
import listHandler from "./handlers/list";
import imageHandler from "./handlers/image";
import iconHandler from "./handlers/icon";
import refreshHandler from "./handlers/refresh";
import searchHandler from "./handlers/search";
import adminHandler from "./handlers/admin";

const router = Router();
const apiRouter = Router();


/**
 * `/list`에는 서브 디렉토리가 있으니 `listHandler`는 express.Router로 만들어졌음.
 */
apiRouter.use("/list", listHandler);
apiRouter.use("/image", imageHandler);
apiRouter.use("/icon", iconHandler);

/**
 * `checkStreamer`는 요청한 스트리머가 유효한 것인지 확인하는 미들웨어임.
 */
apiRouter.use("/refresh", refreshHandler);

/**
 * 키워드 값이 들어올 때 해당되는 주소 리턴하는 것
 * 추후 확장성을 위해서 검색 api가 있는 것이 좋다고 생각함.
 */
apiRouter.use("/search", searchHandler);

/**
 * back
 */
apiRouter.use("/admin", adminHandler);


/**
 * root page
 */
router.get("/", rootHandler);
router.use("/api", apiRouter);


export default router;
