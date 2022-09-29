import { IconInfoSchema, IconSchema } from './../../@types/schemas';
import { Router, Request, Response } from "express";
import { resolve } from "path";

import { DOMAIN } from "../../constants";
import { getImageBasePath } from "../../functions";

import checkStreamer from "./checkStreamer";
import { IconIndex } from "../../@types/interfaces";
import { 
  StreamerListModel,
  IconInfoListModel,
  IconListModel,
} from "../../database";
import Logger from "../../logger";
const logger = Logger(module.filename);

const router = Router({mergeParams: true});
const basePath = resolve(".");

/**
 * 현재 서버에 어떤 스트리머를 지원하는지 보여줌.
 * 스트리머 이름, 아이콘 정보를 제공하는 원본 url 을 알려준다.
 */
const rootHandler = async (req: Request, res: Response) => {
  const streamerData = await StreamerListModel
                            .find()
                            .select('id name nickname lastUpdateDate -_id');
  return res.status(200).json(streamerData);
}

/**
 * parameter로 받은 스트리머에 해당하는 아이콘 목록 json을 리턴함.
 * parameter에 `ts`값이 있다면 
 * 서버에 저장된 아이콘 목록 json의 timestamp 값과 비교하여
 * parameter의 ts 값이 다르다면 아이콘 목록 json을 리턴하고
 * 아니라면 상태 메시지 json을 리턴함.
 */
const listHandler = async (req: Request, res: Response) => {
  const streamer = req.params.streamer;
  const streamerNumber = Number(streamer);
  // 1시간 단위의 timestamp임. Math.floor(timestamp / (1000 * 60 * 60))값.
  const timestamp = Number(req.query.ts || 0);  
  /**
   * 서버에 저장된 아이콘 목록 json에서 이미지 주소는
   * `/`으로 시작하는 서버에서의 절대경로를 저장하고 있음.
   * 
   * 그래서 외부에서 접속 가능한 주소를 만들어 내려면
   * 현재 요청을 받은 도메인 주소를 알아낼 필요가 있다. 
   * 
   * => 리버스프록시 거친 뒤에 path 알아낼 방법이 없으니 상대주소로 함.
   */
  const streamerDoc = await StreamerListModel.findOne(isNaN(streamerNumber) ? {name: streamer} : {id: streamerNumber});
  if(streamerDoc === null)
  {
    logger.warn(`${streamer} is not in database`);
    return res.status(404).json({
      status: false,
      message: `Unsupported streamer ${streamer}`,
    });
  }


  const iconInfoDocs = await IconInfoListModel.find({owner: streamerDoc._id}).select('icon name tags keywords -_id').populate('icon');
  const icons = iconInfoDocs.map((iconInfoDoc: IconInfoSchema) => {
    const icon = iconInfoDoc.icon as IconSchema;
    return {
      name: iconInfoDoc.name,
      tags: iconInfoDoc.tags,
      keywords: iconInfoDoc.keywords,
      path: `${DOMAIN}/images/${icon.iconHash}`
    }
  })
  return res.status(200).json(icons);
}

/**
 * open dccon 포맷으로 서버의 json을 보여줌.
 * {
 *   dccons: []
 * }
 * 이런 형식을 가짐.
 */
const openDcconListHandler = (req: Request, res: Response) => {
  const streamer = req.params.streamer;
  // const jsonPath = resolve(join(getImageBasePath(), INDEX_FILE));
  // const data = fs.readFileSync(jsonPath, "utf8");
  // const regexp = new RegExp(basePath, "g");
  // const uriReplacedData = data.replace(regexp, ".");
  // const jsonData: IconIndex = JSON.parse(uriReplacedData);
  // // 여기까지는 `listHandler`와 동일함.

  // /**
  //  * open dccon에서 사용할 수 있는 포맷으로 새 객체를 만듦.
  //  * timestamp 값은 기존 포맷에는 없지만 나중에 효율성을 위해서 추가함.
  //  */
  // const openDcconJson = {
  //   dccons: [
  //     ...jsonData.icons
  //   ],
  //   timestamp: jsonData.timestamp
  // }

  return res.status(200).json(streamer);
}

router.get("/", rootHandler);
router.get("/:streamer", checkStreamer, listHandler);
router.get("/open-dccon/:streamer", checkStreamer, openDcconListHandler);

export default router;