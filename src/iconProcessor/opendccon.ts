import axios from "axios";
import { createHash } from "crypto";
import { extname } from "path";
import { existsSync, mkdirSync } from "fs";

import { 
  IconIndexOpenDccon, 
  StreamerData,
  Icon,
  IconOpenDccon,
} from "../@types/interfaces";
import { FAILED_LIST_FILE, INDEX_FILE } from "../constants";
import {
  getImageBasePath,
  getThumbnailBasePath,
  saveImage, 
  saveThumbnail, 
  saveJsonFile,
} from "../functions";

import Logger from "../logger";

export const indexDownloader = async (url: string): Promise<IconIndexOpenDccon> => {
  const res = await axios.get(encodeURI(decodeURI(`${url}${url.includes("?") ? "&" : "?"}ts=${Date.now()}`)));
  const jsonData: IconIndexOpenDccon = res.data;
  return jsonData;
}

export const processor = (streamer: StreamerData, jsonData: IconIndexOpenDccon): Promise<void> => {
  const logger = Logger(`${module.filename} [${streamer.name}]`);
  const basePath = getImageBasePath(streamer.name);
  const basePathThumbnail = getThumbnailBasePath(streamer.name);
  const originUrl = new URL(streamer.url).origin;

  let imageBaseUrl = "";
  let imagePropsName = "";

  if(!existsSync(basePath)) mkdirSync(basePath, {recursive: true});
  if(!existsSync(basePathThumbnail)) mkdirSync(basePathThumbnail, {recursive: true});

  const findIconUri = async (icon: IconOpenDccon): Promise<string> => {
    if(icon.path.startsWith("http://") || icon.path.startsWith("https://"))
    {
      imageBaseUrl = "";
      imagePropsName = "path";
      return icon.path;
    }
    
    /**
     * 발견한 주소를 임시 저장해서 비효율적인 요청을 막음.
     */
    if(imageBaseUrl !== "" || imagePropsName !== "")
    {
      return new URL(icon[imagePropsName], imageBaseUrl).href;
    }

    if(streamer.imagePrefix)
    {
      const path = new URL(icon.path, streamer.imagePrefix).href;
      const res = await axios.get(encodeURI(decodeURI(path)), {responseType: "stream"});
      if(res.status === 200)
      {
        imageBaseUrl = streamer.imagePrefix;
        imagePropsName = "path";
        return path;
      }
    }
    else 
    {
      const path = new URL(icon.path, originUrl).href;
      const res = await axios.get(encodeURI(decodeURI(path)), {responseType: "stream"});
      if(res.status === 200)
      {
        imageBaseUrl = originUrl;
        imagePropsName = "path";
        return path;
      }
    }

    const candidateProps = ["uri", "url"];
    for(const prop of candidateProps)
    {
      if(icon[prop])
      {
        if(icon[prop].startsWith("http://") || icon[prop].startsWith("https://")) return icon[prop];
        if(streamer.imagePrefix)
        {
          const path = new URL(icon[prop], streamer.imagePrefix).href;
          const res = await axios.get(encodeURI(decodeURI(path)), {responseType: "stream"});
          if(res.status === 200)
          {
            imageBaseUrl = streamer.imagePrefix;
            imagePropsName = prop;
            return path;
          }
        }
        const path = new URL(icon[prop], originUrl).href;
        const res = await axios.get(encodeURI(decodeURI(path)), {responseType: "stream"});
        if(res.status === 200)
        {
          imageBaseUrl = originUrl;
          imagePropsName = prop;
          return path;
        }
      }
    }

    throw new Error(`Cannot find working url for ${streamer.name} - ${icon.tags[0]}`);
  }


  return new Promise(async (resolve, reject) => {
    try
    {
      const newIconsData = await Promise.all(jsonData.dccons.map(async (icon, index, arr): Promise<Icon> => {
        if(icon.tags.length === 0) icon.tags = ["미지정"];
        const iconHash = createHash("md5").update(`${icon.tags[0]}.${icon.keywords[0]}`).digest('hex');
        const iconExt = extname(icon.path) || ".jpg";
        const iconUri = await findIconUri(icon);
        const newIcon: Icon = {
          name: `${icon.keywords[0]}${iconExt}`,
          nameHash: iconHash,
          uri: `${basePath}/${iconHash}${iconExt}`,
          thumbnailUri: `${basePath}/${iconHash}${iconExt}?small`,
          keywords: icon.keywords,
          tags: icon.tags,
          useOrigin: false,
          originUri: iconUri
        };
        
        try 
        {
          await saveImage(newIcon.originUri, newIcon.uri, logger);
          await saveThumbnail(newIcon.uri, `${basePathThumbnail}/${iconHash}${iconExt}`, logger);
          return newIcon;
        }
        catch(err)
        {
          logger.error(err);
          logger.error(icon);
          logger.error(`use origin uri`)
          return {
            ...newIcon,
            useOrigin: true
          };
        }
      }));
      logger.info(`Download Icons done! -> ${basePath}`);

      const failedListJson: {[key: string]: Icon} = {};
      for(const icon of newIconsData)
      {
        if(icon.useOrigin)
        {
          failedListJson[icon.nameHash || icon.name] = icon;
        }
      }
      await saveJsonFile(failedListJson, `${basePath}/${FAILED_LIST_FILE}`, logger);
      logger.info(`Save failed index done! -> ${basePath}/${FAILED_LIST_FILE}`);

      const finalData = {
        icons: newIconsData,
        timestamp: Date.now(),
      }
      await saveJsonFile(finalData, `${basePath}/${INDEX_FILE}`, logger);
      logger.info(`Save Index done! -> ${basePath}/${INDEX_FILE}`);
    }
    catch(err)
    {
      reject(err);
    }
  });
}