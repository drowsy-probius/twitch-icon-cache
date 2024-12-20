import { Router } from 'express';
import {
  imageHandler,
  listHandler,
  rootHandler,
  checkStreamerWrapper,
  iconHandler,
  refreshHandler,
  searchHandler,
} from './handlers';

const router = Router();

router.get('/', rootHandler);

/**
 * `/list`에는 서브 디렉토리가 있으니 `listHandler`는 express.Router로 만들어졌음.
 */
router.use('/list', listHandler);

/**
 * `checkStreamer`는 요청한 스트리머가 유효한 것인지 확인하는 미들웨어임.
 */
router.get(
  '/images/:streamer/:image',
  checkStreamerWrapper('twitch'),
  imageHandler
);

router.get('/icon', iconHandler);

/**
 * `checkStreamer`는 요청한 스트리머가 유효한 것인지 확인하는 미들웨어임.
 */
router.get(
  '/refresh/:streamer',
  checkStreamerWrapper('twitch'),
  refreshHandler
);

/**
 * 키워드 값이 들어올 때 해당되는 주소 리턴하는 것
 * 추후 확장성을 위해서 검색 api가 있는 것이 좋다고 생각함.
 */
router.use('/search', searchHandler);

export default router;
