import axios from "axios";
import { createHash } from "crypto";
import fs from "fs";
import { resolve, extname } from "path";

import { Icon, IconIndex, IconIndexFunzinnu, IconProcessorFunction, StreamerData } from "../@types/interfaces"
import { INDEX_FILE, FAILED_LIST_FILE } from "../constants";
import { saveImage, saveThumbnail, saveJsonFile } from "../functions";

import Logger from "../logger";
const logger = Logger(module.filename);

const basePath = resolve("./images/funzinnu");
const basePathThumbnail = resolve("./images/funzinnu/thumbnail");

const handler: IconProcessorFunction = async (streamer: StreamerData) => {
  logger.info(`Downloading icons for ${streamer.name} from ${streamer.url}`);

  if(!fs.existsSync(basePath)) fs.mkdirSync(basePath, {recursive: true});
  if(!fs.existsSync(basePathThumbnail)) fs.mkdirSync(basePathThumbnail, {recursive: true});
  
  try
  {
    const res = await axios.get(`${streamer.url}?ts=${Date.now()}`);
    const jsonString = res.data.replace("dcConsData = ", `{"icons" : `).replace(/;$/, "}");
    const jsonData: IconIndexFunzinnu = JSON.parse(jsonString);
    const newJsonData = await processJsonData(jsonData);
    logger.info(`Download Funzinnu's Icons done! -> ${basePath}`);
    await saveJsonFile(newJsonData, `${basePath}/${INDEX_FILE}`);
    logger.info(`Save Funzinnu's Index done! -> ${basePath}/${INDEX_FILE}`);
  }
  catch(err)
  {
    logger.error(err);
  }  
}


const processJsonData = (jsonData: IconIndexFunzinnu): Promise<IconIndex> => {
  return new Promise(async (resolve, reject) => {
    try
    {
      const newIconsData = await Promise.all(jsonData.icons.map(async (icon, index, arr): Promise<Icon> => {
        const iconHash = createHash("md5").update(`${icon.tags[0]}.${icon.keywords[0]}`).digest('hex');
        const iconExt = extname(icon.uri) || ".jpg";
        const newIcon: Icon = {
          name: icon.name,
          nameHash: iconHash,
          uri: `${basePath}/${iconHash}${iconExt}`,
          thumbnailUri: `${basePath}/${iconHash}${iconExt}?small`,
          keywords: icon.keywords,
          tags: icon.tags,
          useOrigin: false,
          originUri: icon.uri
        };
        
        try 
        {
          await saveImage(icon.uri, newIcon.uri);
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
      logger.info(`Save Funzinnu's failed index done! -> ${basePath}/${FAILED_LIST_FILE}`);

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