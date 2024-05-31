import axios from "axios";
import { createHash } from "crypto";
import { extname } from "path";
import { existsSync, mkdirSync } from "fs";

import {
  IconIndexBridgeBBCC,
  Icon,
  IconProps,
  IconBridgeBBCC,
  StreamerData,
} from "../@types/interfaces";
import { FAILED_LIST_FILE, ICON_SIZE, INDEX_FILE } from "../constants";
import {
  getImageBasePath,
  getResizeBasePath,
  saveImage,
  resizeAndSaveImage,
  saveJsonFile,
} from "../functions";

import Logger from "../Logger";

export const indexDownloader = async (
  url: string
): Promise<IconIndexBridgeBBCC> => {
  const res = await axios.get(
    encodeURI(
      decodeURI(`${url}${url.includes("?") ? "&" : "?"}ts=${Date.now()}`)
    )
  );
  const jsonString = res.data
    .replace("dcConsData = ", `{"dcConsData" : `)
    .replaceAll(/\s+([a-zA-Z0-9_]+)\s*:/g, '"$1": ') // quote all unquoted keys
    .replaceAll(/,(\s*[}\]])/g, "$1") // remove tailing comma
    .replace(/;\s*$/, "}")
    .replace(
      /\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g,
      (m: unknown, g: unknown) => (g ? "" : m)
    ); // remove comments

  const jsonData: IconIndexBridgeBBCC = JSON.parse(jsonString);
  return jsonData;
};

export const processor = async (
  streamer: StreamerData,
  jsonData: IconIndexBridgeBBCC
): Promise<void> => {
  const logger = Logger(`${module.filename} [${streamer.name.twitch}]`);
  const basePath = getImageBasePath(streamer.name.twitch);
  const originUrl = new URL(streamer.url).origin;

  let imageBaseUrl = "";
  let imagePropsName: IconProps;

  if (!existsSync(basePath)) mkdirSync(basePath, { recursive: true });
  for (const iconSize of ICON_SIZE) {
    const resizeBasePath = getResizeBasePath(streamer.name.twitch, iconSize)
    if (!existsSync(resizeBasePath))
      mkdirSync(resizeBasePath, { recursive: true });
  }

  const findIconUri = async (icon: IconBridgeBBCC): Promise<string | null> => {
    if (imageBaseUrl !== "" || imagePropsName !== undefined) {
      return new URL(icon[imagePropsName] as string, imageBaseUrl).href;
    }

    const candidateProps: IconProps[] = ["uri", "path", "url"];
    for (const prop of candidateProps) {
      if (icon[prop]) {
        const propValue = icon[prop];
        if (typeof propValue !== "string") continue;

        if (propValue.startsWith("http://") || propValue.startsWith("https://"))
          return propValue;

        if (streamer.imagePrefix) {
          try {
            const path = new URL(propValue, streamer.imagePrefix).href;
            const res = await axios.get(encodeURI(decodeURI(path)), {
              responseType: "stream",
            });
            if (res.status === 200) {
              imageBaseUrl = streamer.imagePrefix;
              imagePropsName = prop;
              return path;
            }
          } catch (error) {
            logger.debug(`not ${streamer.imagePrefix} ${propValue}`);
          }
        }

        try {
          const path = new URL(propValue, originUrl).href;
          const res = await axios.get(encodeURI(decodeURI(path)), {
            responseType: "stream",
          });
          if (res.status === 200) {
            imageBaseUrl = originUrl;
            imagePropsName = prop;
            return path;
          }
        } catch (error) {
          logger.debug(`not ${originUrl} ${propValue}`);
        }
      }
    }
    if (streamer.imagePrefix) {
      try {
        const path = new URL(icon.name, streamer.imagePrefix).href;
        const res = await axios.get(encodeURI(decodeURI(path)), {
          responseType: "stream",
        });
        if (res.status === 200) {
          imageBaseUrl = streamer.imagePrefix;
          imagePropsName = "name";
          return path;
        }
      } catch (error) {
        logger.debug(`not ${streamer.imagePrefix} ${icon.name}`);
      }
    }
    /**
     * dccon subpath가 기본인 듯?
     */
    try {
      const path1 = new URL(`images/${icon.name}`, originUrl).href;
      const res1 = await axios.get(encodeURI(decodeURI(path1)), {
        responseType: "stream",
      });
      if (res1.status === 200) {
        imageBaseUrl = `${originUrl}/images/`;
        imagePropsName = "name";
        return path1;
      }
    } catch (error) {
      logger.debug(`not ${originUrl}/images/${icon.name}`);
    }

    try {
      const path2 = new URL(`images/dccon/${icon.name}`, originUrl).href;
      const res2 = await axios.get(encodeURI(decodeURI(path2)), {
        responseType: "stream",
      });
      if (res2.status === 200) {
        imageBaseUrl = `${originUrl}/images/dccon/`;
        imagePropsName = "name";
        return path2;
      }
    } catch (error) {
      logger.debug(`not ${originUrl}/images/dccon/${icon.name}`);
    }

    logger.error(
      `Cannot find working url for ${streamer.name.twitch} - ${JSON.stringify(
        icon
      )}`
    );
    return null;
  };

  /**
   * 원본 아이콘 index 각각에 대해서
   * 이미지 저장, 축소된 이미지 저장을 하고
   * 해당 정보를 가진 새 객체를 리턴하도록 함.
   *
   * 각각이 Promise를 리턴하도록 해서 Promise.all을 통해서
   * newIconsData변수에 새로운 배열을 할당함.
   */
  const newIconsData = await Promise.all(
    jsonData.dcConsData.map(async (icon: IconBridgeBBCC): Promise<Icon> => {
      /**
       * 일관성을 위해서 원본 아이콘 index에 tags가 비었다면
       * 미지정이라는 값을 추가함.
       *
       * 어차피 아이콘 치환은 keywords에 있는 값으로만 이루어지므로 상관 없음.
       */
      if (icon.tags === undefined || icon.tags.length === 0)
        icon.tags = ["미지정"];

      /**
       * nameHash를 md5로 만듬.
       * 태그[0].키워드[0]
       * keywords[0]은 존재함이 보장됨.
       *
       * hash로 왜 만드는가?
       * 주소로 이미지를 요청할 때 uri encoding하지 않아도 되는 장점이 있음.
       * 식별자로 활용하기 좋음.
       */
      const iconHash = createHash("md5")
        .update(`${icon.tags[0]}.${icon.keywords[0]}`)
        .digest("hex");
      /**
       * BridgeBBCC 포맷에서는 name이 파일이름을 가리킴.
       */
      const iconExt = extname(icon.name) || ".jpg";
      /**
       * 실제 아이콘 이미지 주소 찾기
       * 스트리머가 지정하지 않은 경우도 존재하기 때문.
       */
      const iconUri = await findIconUri(icon);
      if (!iconUri) {
        return {
          name: icon.name,
          nameHash: iconHash,
          // 여기서 저장되는 basePath는 `/`으로 시작하는 앱이 구동되는 서버의 절대경로임.
          uri: `${basePath}/${iconHash}${iconExt}`,
          thumbnailUri: `${basePath}/${iconHash}${iconExt}?size=48`,
          keywords: icon.keywords,
          tags: icon.tags,
          // 이 값이 true이면 uri로 접근하지 않고 originUri로 접근함.
          useOrigin: true,
          originUri: "/icon", // cannot resolve origin icon
        };
      }

      const newIcon: Icon = {
        name: icon.name,
        nameHash: iconHash,
        // 여기서 저장되는 basePath는 `/`으로 시작하는 앱이 구동되는 서버의 절대경로임.
        uri: `${basePath}/${iconHash}${iconExt}`,
        thumbnailUri: `${basePath}/${iconHash}${iconExt}?size=48`,
        keywords: icon.keywords,
        tags: icon.tags,
        // 이 값이 true이면 uri로 접근하지 않고 originUri로 접근함.
        useOrigin: false,
        originUri: iconUri,
      };

      try {
        // 원본 이미지 저장
        await saveImage(newIcon.originUri, newIcon.uri, logger);
        // 축소된 이미지 저장
        await Promise.all(ICON_SIZE.map(iconSize => {
          const resizeBasePath = getResizeBasePath(streamer.name.twitch, iconSize)
          return resizeAndSaveImage(
            newIcon.uri,
            `${resizeBasePath}/${iconHash}${iconExt}`,
            iconSize,
            logger,
          )
        }));
        // 성공하면 새 아이콘 정보 리턴.
        return newIcon;
      } catch (err) {
        logger.error(err);
        logger.error(icon);
        logger.error(`use origin uri`);
        return {
          ...newIcon,
          useOrigin: true,
        };
      }
    })
  );
  logger.info(`Download Icons done! -> ${basePath}`);

  const failedListJson: { [key: string]: Icon } = {};
  for (const icon of newIconsData) {
    // useOrigin=true인 것은 이미지 다운로드, 처리에 실패한 것들 뿐임.
    if (icon.useOrigin) {
      /**
       * nameHash를 키로 사용함.
       * 혹시 에러가 발생할까봐 name항목을 설정했음.
       */
      failedListJson[icon.nameHash || icon.name] = icon;
    }
  }
  // 이미지 다운로드, 처리에 실패한 목록을 저장함.
  await saveJsonFile(failedListJson, `${basePath}/${FAILED_LIST_FILE}`, logger);
  logger.info(`Save failed index done! -> ${basePath}/${FAILED_LIST_FILE}`);

  const finalData = {
    icons: newIconsData,
    timestamp: Date.now(),
  };
  await saveJsonFile(finalData, `${basePath}/${INDEX_FILE}`, logger);
  logger.info(`Save Index done! -> ${basePath}/${INDEX_FILE}`);
};
