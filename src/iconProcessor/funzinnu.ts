import axios from "axios";
import { createHash } from "crypto";
import fs from "fs";
import { extname } from "path";

import { Icon, IconIndex, IconIndexFunzinnu, IconProcessorFunction, StreamerData } from "../@types/interfaces"
import { INDEX_FILE, FAILED_LIST_FILE } from "../constants";
import { 
  getImageBasePath,
  getThumbnailBasePath,
  saveImage, 
  saveThumbnail, 
  saveJsonFile,
} from "../functions";

import Logger from "../logger";
const logger = Logger(module.filename);

let streamerName: string;
let basePath: string;
let basePathThumbnail: string;

/**
 * 기본으로 export되는 대표 모듈임.
 */
const handler: IconProcessorFunction = async (streamer: StreamerData) => {
  logger.info(`Downloading icons for ${streamer.name} from ${streamer.url}`);

  // 스트리머 이름(id)를 할당
  streamerName = streamer.name;
  // 원본 크기 이미지를 저장할 주소 할당
  basePath = getImageBasePath(streamerName);
  // 축소된 이미지를 저장할 주소 할당
  basePathThumbnail = getThumbnailBasePath(streamerName);

  // 해당 폴더가 없으면 생성함. mkdir -p와 같음.
  if(!fs.existsSync(basePath)) fs.mkdirSync(basePath, {recursive: true});
  if(!fs.existsSync(basePathThumbnail)) fs.mkdirSync(basePathThumbnail, {recursive: true});
  
  try
  {
    // 우선 원본 서버로부터 아이콘 index를 다운받음.
    const jsonData = await indexDownloader(streamer.url);
    // 아이콘 index로부터 이미지를 다운받고 축소하는 등의 처리를 함.
    const newJsonData = await processJsonData(jsonData);
    logger.info(`Download ${streamerName}'s Icons done! -> ${basePath}`);
    // 아이콘 index파일을 서버에 JSON형식으로 저장함.
    await saveJsonFile(newJsonData, `${basePath}/${INDEX_FILE}`);
    logger.info(`Save ${streamerName}'s Index done! -> ${basePath}/${INDEX_FILE}`);
  }
  catch(err)
  {
    logger.error(err);
  }  
}

export const indexDownloader = async (url: string): Promise<IconIndexFunzinnu> => {
  // 원본 서버에 get요청을 함. ts파라미터를 추가해서 캐시되지 않은 데이터를 가져오도록 한다.
  const res = await axios.get(`${url}${url.includes("?") ? "&" : "?"}ts=${Date.now()}`);
  /**
   * funzinnu의 데이터는 json형식이 아니라 자바스크립트 eval()함수를 의도하고 만든 것으로 보임.
   * 그래서 정규식을 이용해서 json으로 인식하도록 데이터를 수정함.
   */
  const jsonString = res.data.replace("dcConsData = ", `{"dcConsData" : `).replace(/;$/, "}");
  const jsonData: IconIndexFunzinnu = JSON.parse(jsonString);
  return jsonData;
}

const processJsonData = (jsonData: IconIndexFunzinnu): Promise<IconIndex> => {
  return new Promise(async (resolve, reject) => {
    try
    {
      /**
       * 원본 아이콘 index 각각에 대해서 
       * 이미지 저장, 축소된 이미지 저장을 하고 
       * 해당 정보를 가진 새 객체를 리턴하도록 함.
       * 
       * 각각이 Promise를 리턴하도록 해서 Promise.all을 통해서
       * newIconsData변수에 새로운 배열을 할당함.
       */
      const newIconsData = await Promise.all(jsonData.dcConsData.map(async (icon, index, arr): Promise<Icon> => {
        /**
         * 검색 일관성을 위해서 원본 아이콘 index에 tags가 비었다면
         * 미지정이라는 값을 추가함.
         * 
         * 어차피 아이콘 치환은 keywords에 있는 값으로만 이루어지므로 상관 없음.
         */
        if(icon.tags.length === 0) icon.tags = ["미지정"];

        /**
         * nameHash를 md5로 만듬.
         * 태그[0].키워드[0]
         * 
         * hash로 왜 만드는가?
         * 주소로 이미지를 요청할 때 uri encoding하지 않아도 되는 장점이 있음.
         * 식별자로 활용하기 좋음.
         */
        const iconHash = createHash("md5").update(`${icon.tags[0]}.${icon.keywords[0]}`).digest('hex');
        /**
         * 원본 요청 주소에 확장자가 없으면 jpg라고 생각함.
         */
        const iconExt = extname(icon.uri) || ".jpg";
        const newIcon: Icon = {
          name: icon.name,
          nameHash: iconHash,
          // 여기서 저장되는 basePath는 `/`으로 시작하는 앱이 구동되는 서버의 절대경로임.
          uri: `${basePath}/${iconHash}${iconExt}`,
          thumbnailUri: `${basePath}/${iconHash}${iconExt}?small`,
          keywords: icon.keywords,
          tags: icon.tags,
          // 이 값이 true이면 uri로 접근하지 않고 originUri로 접근함.
          useOrigin: false,
          originUri: icon.uri
        };

        try 
        {
          // 원본 이미지 저장
          await saveImage(icon.uri, newIcon.uri);
          // 축소된 이미지 저장
          await saveThumbnail(newIcon.uri, `${basePathThumbnail}/${iconHash}${iconExt}`);
          // 성공하면 새 아이콘 정보 리턴.
          return newIcon;
        }
        catch(err)
        {
          logger.error(err);
          logger.error(icon);
          logger.error(`use origin uri`)
          // 실패해도 새 아이콘 정보 리턴하는데 useOrigin=true로 설정함.
          return {
            ...newIcon,
            useOrigin: true
          };
        }
      }));

      const failedListJson: {[key: string]: Icon} = {};
      for(const icon of newIconsData)
      {
        // useOrigin=true인 것은 이미지 다운로드, 처리에 실패한 것들 뿐임.
        if(icon.useOrigin)
        {
          /**
           * nameHash를 키로 사용함.
           * 혹시 에러가 발생할까봐 name항목을 설정했음.
           */
          failedListJson[icon.nameHash || icon.name] = icon;
        }
      }
      // 이미지 다운로드, 처리에 실패한 목록을 저장함.
      await saveJsonFile(failedListJson, `${basePath}/${FAILED_LIST_FILE}`);
      logger.info(`Save ${streamerName}'s failed index done! -> ${basePath}/${FAILED_LIST_FILE}`);

      // 아이콘 목록와 처리한 시간을 리턴함.
      resolve({
        icons: newIconsData,
        timestamp: Date.now(),
      });
    }
    catch(err)
    {
      reject(err);
    }
  });
}


export default handler;