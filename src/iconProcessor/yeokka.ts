import axios from "axios";
import { createHash } from "crypto";
import fs from "fs";
import { resolve, extname } from "path";

import { Icon, IconIndex, IconIndexYeokka, IconProcessorFunction, StreamerData } from "../@types/interfaces"
import { INDEX_FILE, FAILED_LIST_FILE } from "../constants";
import { 
  getImageBasePath,
  getThumbnailBasePath,
  saveImage, 
  saveThumbnail, 
  saveJsonFile 
} from "../functions";

import Logger from "../logger";
const logger = Logger(module.filename);

let streamerName: string;
let basePath: string;
let basePathThumbnail: string;

const handler: IconProcessorFunction = async (streamer: StreamerData) => {
  logger.info(`Downloading icons for ${streamer.name} from ${streamer.url}`);
  
  streamerName = streamer.name;
  basePath = getImageBasePath(streamerName);
  basePathThumbnail = getThumbnailBasePath(streamerName);

  if(!fs.existsSync(basePath)) fs.mkdirSync(basePath, {recursive: true});
  if(!fs.existsSync(basePathThumbnail)) fs.mkdirSync(basePathThumbnail, {recursive: true});
  
  try
  {
    const jsonData = await indexDownloader(streamer.url);
    const newJsonData = await processJsonData(jsonData);
    logger.info(`Download ${streamerName}'s Icons done! -> ${basePath}`);
    await saveJsonFile(newJsonData, `${basePath}/${INDEX_FILE}`);
    logger.info(`Save ${streamerName}'s Index done! -> ${basePath}/${INDEX_FILE}`);
  }
  catch(err)
  {
    logger.error(err);
  }  
}

export const indexDownloader = async (url: string): Promise<IconIndexYeokka> => {
  const res = await axios.get(`${url}?ts=${Date.now()}`, );
  const jsonData: IconIndexYeokka = res.data;
  return jsonData;
}

const processJsonData = (jsonData: IconIndexYeokka): Promise<IconIndex> => {
  return new Promise(async (resolve, reject) => {
    try
    {
      const newIconsData = await Promise.all(jsonData.dccons.map(async (icon, index, arr): Promise<Icon> => {
        const iconHash = createHash("md5").update(`${icon.tags[0]}.${icon.keywords[0]}`).digest('hex');
        const iconExt = extname(icon.path) || ".jpg";
        const newIcon: Icon = {
          name: `${icon.keywords[0]}${iconExt}`,
          nameHash: iconHash,
          uri: `${basePath}/${iconHash}${iconExt}`,
          thumbnailUri: `${basePath}/${iconHash}${iconExt}?small`,
          keywords: icon.keywords,
          tags: icon.tags,
          useOrigin: false,
          originUri: icon.path
        };
        
        try 
        {
          await saveImage(icon.path, newIcon.uri);
          await saveThumbnail(newIcon.uri, `${basePathThumbnail}/${iconHash}${iconExt}`);
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

      const failedListJson: {[key: string]: Icon} = {};
      for(const icon of newIconsData)
      {
        if(icon.useOrigin)
        {
          failedListJson[icon.nameHash || icon.name] = icon;
        }
      }
      await saveJsonFile(failedListJson, `${basePath}/${FAILED_LIST_FILE}`);
      logger.info(`Save ${streamerName}'s failed index done! -> ${basePath}/${FAILED_LIST_FILE}`);

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