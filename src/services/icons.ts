import { resolve, join } from "path";
import fs from "fs";

import { Icon, IconIndex, StreamPlatform } from "../@types/interfaces";
import { getImageBasePath } from "../functions";
import { INDEX_FILE } from "../constants";
import { STREAMER_DATA } from "../data";

const basePath = resolve(".");

export const getIconIndexByTwitch = (twitchName: string): IconIndex => {
  /**
   * 서버에 저장된 아이콘 목록 json에서 이미지 주소는
   * `/`으로 시작하는 서버에서의 절대경로를 저장하고 있음.
   *
   * 그래서 외부에서 접속 가능한 주소를 만들어 내려면
   * 현재 요청을 받은 도메인 주소를 알아낼 필요가 있다.
   *
   * => 리버스프록시 거친 뒤에 path 알아낼 방법이 없으니 상대주소로 함.
   */
  const jsonPath = resolve(join(getImageBasePath(twitchName), INDEX_FILE));
  /**
   * 서버에 저장된 아이콘 목록 json파일이 존재하는지 확인.
   */

  if (!fs.existsSync(jsonPath)) {
    throw Error(`server has not downloaded any data from ${twitchName}`);
  }

  const data = fs.readFileSync(jsonPath, "utf8");
  // 서버에서 구동되는 앱의 절대 경로를 모두 찾음.
  const regexp = new RegExp(basePath, "g");
  // 앱의 절대 경로를 상대경로로 교체함.
  const uriReplacedData = data.replace(regexp, ".");
  // 교체한 후에 json으로 파싱함.
  const jsonData: IconIndex = JSON.parse(uriReplacedData);

  return jsonData;
};

export const convertToTwitchName = (
  platform: StreamPlatform,
  streamName: string
): string => {
  if (platform === "twitch") return streamName;

  let streamer = undefined;
  if (platform === "chzzk") {
    streamer = STREAMER_DATA.find((sd) => sd.name.chzzk === streamName);
  } else if (platform === "youtube") {
    streamer = STREAMER_DATA.find((sd) => sd.name.youtube === streamName);
  }

  if (!streamer) {
    throw Error(`No such streamer: ${platform}/${streamName}`);
  }
  return streamer.name.twitch;
};

export const convertIconIndexToOpenDccon = (
  iconIndex: IconIndex
): Record<string, Icon[] | number> => {
  /**
   * open dccon 포맷으로 서버의 json을 보여줌.
   * {
   *   dccons: []
   * }
   * 이런 형식을 가짐.
   *
   * open dccon에서 사용할 수 있는 포맷으로 새 객체를 만듦.
   * timestamp 값은 기존 포맷에는 없지만 나중에 효율성을 위해서 추가함.
   */
  return {
    dccons: [...iconIndex.icons],
    timestamp: iconIndex.timestamp,
  };
};

export const convertIconIndexToChatAssistX = (iconIndex: IconIndex): string => {
  /**
   *
   * dcConsData = [
   *    {"name":"", "uri":"....gif", "keywords":[""], "tags":[""]},
   *  ]
   */

  // https://api.probius.dev/twitch-icons/cdn/images/funzinnu/db90fb44fe88955c471369ff8a171d15.png
  // icon.uri = ./images/{streamerName}/{filename}.gif
  const chatAssistXList = iconIndex.icons.map((icon) => ({
    name: icon.name,
    uri: `https://api.probius.dev/twitch-icons/cdn${icon.uri.slice(1)}`,
    keywords: icon.keywords,
    tags: icon.tags,
  }));
  const chatAssistXListText = `dcConsData = [
    ${chatAssistXList.map((icon) => JSON.stringify(icon)).join(",\n")}
  ];`;

  return chatAssistXListText;
};
