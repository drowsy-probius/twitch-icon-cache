import { Router, Request, Response, NextFunction } from "express";
import { resolve, join } from "path";
import fs from "fs";

import { STREAMER_DATA } from "../../data";
import { INDEX_FILE } from "../../constants";
import { getImageBasePath } from "../../functions";

import checkStreamer from "./checkStreamer";
import { IconIndex } from "../../@types/interfaces";

const router = Router({mergeParams: true});
const basePath = resolve(".");

/**
 * 현재 서버에 어떤 스트리머를 지원하는지 보여줌.
 * 스트리머 이름, 아이콘 정보를 제공하는 원본 url 을 알려준다.
 */
const rootHandler = (req: Request, res: Response, next: NextFunction) => {
  return res.status(200).json(STREAMER_DATA);
}

/**
 * parameter로 받은 스트리머에 해당하는 아이콘 목록 json을 리턴함.
 * parameter에 `ts`값이 있다면 
 * 서버에 저장된 아이콘 목록 json의 timestamp 값과 비교하여
 * parameter의 ts 값이 다르다면 아이콘 목록 json을 리턴하고
 * 아니라면 상태 메시지 json을 리턴함.
 */
const listHandler = (req: Request, res: Response, next: NextFunction) => {
  const streamer = req.params.streamer;
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
  const jsonPath = resolve(join(getImageBasePath(streamer), INDEX_FILE));
  /**
   * 서버에 저장된 아이콘 목록 json파일이 존재하는지 확인.
   */
  if(!fs.existsSync(jsonPath))
  {
    return res.status(404).json({
      status: false,
      message: `server has not downloaded any data from ${streamer}`
    });
  }

  const data = fs.readFileSync(jsonPath, "utf8");
  // 서버에서 구동되는 앱의 절대 경로를 모두 찾음.
  const regexp = new RegExp(basePath, "g");
  // 앱의 절대 경로를 상대경로로 교체함.
  const uriReplacedData = data.replace(regexp, ".");
  // 교체한 후에 json으로 파싱함.
  const jsonData: IconIndex = JSON.parse(uriReplacedData);
  /**
   * parameter로 받은 ts값과 서버의 json의 timestamp과 비교해서
   * 같다면 굳이 새 데이터를 리턴해줄 필요가 없음.
   * 
   * 앞에 비교는 legacy 지원하기 위함.
   * 로컬 json에 저장된 데이터는 여전히 ms단위로 할 것임.
   */
  if(timestamp === jsonData.timestamp || timestamp === Math.floor(jsonData.timestamp / (1000 * 60 * 60)))
  {
    return res.status(200).json({
      status: false,
      message: `your data is not outdated.`
    })
  }

  return res.status(200).json(jsonData);
}

/**
 * open dccon 포맷으로 서버의 json을 보여줌.
 * {
 *   dccons: []
 * }
 * 이런 형식을 가짐.
 */
const openDcconListHandler = (req: Request, res: Response, next: NextFunction) => {
  const streamer = req.params.streamer;
  const jsonPath = resolve(join(getImageBasePath(streamer), INDEX_FILE));
  const data = fs.readFileSync(jsonPath, "utf8");
  const regexp = new RegExp(basePath, "g");
  const uriReplacedData = data.replace(regexp, ".");
  const jsonData: IconIndex = JSON.parse(uriReplacedData);
  // 여기까지는 `listHandler`와 동일함.

  /**
   * open dccon에서 사용할 수 있는 포맷으로 새 객체를 만듦.
   * timestamp 값은 기존 포맷에는 없지만 나중에 효율성을 위해서 추가함.
   */
  const openDcconJson = {
    dccons: [
      ...jsonData.icons
    ],
    timestamp: jsonData.timestamp
  }

  return res.status(200).json(openDcconJson);
}

router.get("/", rootHandler);
router.get("/:streamer", checkStreamer, listHandler);
router.get("/open-dccon/:streamer", checkStreamer, openDcconListHandler);

export default router;