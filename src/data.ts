import { StreamerData } from "./@types/interfaces"

const TYPE = {
  /**
   * {"dccons": [{
   * 
   *  path: string, // 상대경로, 절대경로 체크 해야 함.
   * 
   *  keywords: string[],
   * 
   *  tags: string[],
   * 
   * }]}
   * 
   * https://open-dccon-selector.update.sh/api/dccon-url?channel_name=
   * 를 통헤서 얻을 수 있음.
   */
  openDccon: 0,

  /**
   * dcConsData = [{
   * 
   *  name: string,
   * 
   *  keywords: string[],
   * 
   *  tags: string[],
   * 
   *  // 옵션임.
   *  // 없다면 example.com/images/name 또는 example.com/images/dccon/name
   *  uri?: string, 
   * 
   * }]
   */
  BridgeBBCC: 1,
}


/**
 * 서버 관리자가 설정해야 할 내용.
 * 추후 규모가 커진다면 스트리머가 직접 설정하도록 오픈할 예정임.
 **/
export const STREAMER_DATA: StreamerData[] = [
  {
    name: {
      twitch: "funzinnu",
      chzzk: "7d4157ae4fddab134243704cab847f23",
      youtube: null,
    },
    id: {
      twitch: 49469880,
      chzzk: null,
      youtube: null,
    },
    url: "https://www.funzinnu.com/stream/dccon.js",
    type: TYPE.BridgeBBCC,
    nickname: "펀즈",
  },
  {
    name: {
      twitch: "yeokka",
      chzzk: null,
      youtube: null,
    },
    id: {
      twitch: 124535126,
      chzzk: null,
      youtube: null,
    },
    url: "https://watert.gitlab.io/emotes/yeokka/ODF.json",
    type: TYPE.openDccon,
    nickname: "여까",
  },
  {
    name: {
      twitch: "telk5093",
      chzzk: null,
      youtube: null,
    },
    id: {
      twitch: 106620687,
      chzzk: null,
      youtube: null,
    },
    url: "https://tv.telk.kr/?mode=json",
    imagePrefix: "https://tv.telk.kr/images/",
    type: TYPE.openDccon,
    nickname: "텔크",
  },
  {
    name: {
      twitch: "sleeping_ce",
      chzzk: null,
      youtube: null,
    },
    id: {
      twitch: 414759894,
      chzzk: null,
      youtube: null,
    },
    url: "https://open-dccon-selector.update.sh/api/channel/414759894/cached-dccon",
    type: TYPE.openDccon,
    nickname: "잠자는꼬마선충",
  },
  {
    name: {
      twitch: "smalljuzi6974",
      chzzk: "a6d9b0eeca16dd613bf0ebe8d5b8991b",
      youtube: null,
    },
    id: {
      twitch: 182673681,
      chzzk: null,
      youtube: null,
    },
    url: "https://iconttv.github.io/twitch/smalljuzi6974/list.js",
    imagePrefix: "https://iconttv.github.io/twitch/smalljuzi6974/dccon/",
    type: TYPE.BridgeBBCC,
    nickname: "한심한진돌이",
  },
];
