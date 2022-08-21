import axios from "axios";
import fs from "fs";
import { resolve } from "path";

import { IconFunzinnu, IconIndexFunzinnu, IconProcessorFunction, StreamerData } from "../@types/interfaces"
import { MAX_RETRY, INDEX_FILE, FAILED_LIST_FILE } from "../constants";
import { sleep } from "../functions";

import Logger from "../logger";
const logger = Logger(module.filename);

const basePath = resolve("./images/funzinnu");

const handler: IconProcessorFunction = async (streamer: StreamerData) => {
  logger.info(`Downloading icons for ${streamer.name} from ${streamer.url}`);

  if(!fs.existsSync(basePath)) fs.mkdirSync(basePath, {recursive: true});
  
  try
  {
    const res = await axios.get(streamer.url);
    const jsonString = res.data.replace("dcConsData = ", `{"dcConsData" : `).replace(/;$/, "}");
    const jsonData: IconIndexFunzinnu = {
      ...JSON.parse(jsonString),
      timestamp: Date.now(),
    }
    const newJsonData = await processJsonData(jsonData);
    logger.info(`Download Funzinnu's Icons done! -> ${basePath}`);
    await saveJsonIndex(newJsonData, `${basePath}/${INDEX_FILE}`);
    logger.info(`Save Funzinnu's Index done! -> ${basePath}/${INDEX_FILE}`);
  }
  catch(err)
  {
    logger.error(err);
  }  
}



const processJsonData = (jsonData: IconIndexFunzinnu): Promise<IconIndexFunzinnu> => {
  return new Promise(async (resolve, reject) => {
    try
    {
      const newDcConsData = await Promise.all(jsonData.dcConsData.map((dccon, index, arr): Promise<IconFunzinnu> => {
        return new Promise(async (resolve, _) => {
          const dcconName = `${dccon.keywords[0]}.${dccon.uri.split('.').pop()}`
          const newDcCon: IconFunzinnu = {
            name: dcconName,
            uri: `${basePath}/${dcconName}`,
            keywords: dccon.keywords,
            tags: dccon.tags,
            use_origin: false,
            origin_uri: dccon.uri
          };
          
          let saveImageRetries = 0;
          let saveImageError = undefined;
          do 
          {
            try 
            {
              await saveImage(dccon, newDcCon.uri);

              if(saveImageRetries > 0)
              {
                logger.info(`try#${saveImageRetries} - ${dccon.uri} - ${newDcCon.uri} : success!`);
              }
              resolve(newDcCon);
              break;
            }
            catch(err)
            {
              saveImageRetries += 1;
              saveImageError = err;
              logger.error(`try#${saveImageRetries} - ${dccon.uri} - ${newDcCon.uri} : ${err}`);
            }
          }
          while(saveImageRetries < MAX_RETRY)

          if(saveImageRetries >= MAX_RETRY)
          {
            logger.error(saveImageError);
            logger.error(dccon);
            resolve({
              ...newDcCon,
              use_origin: true
            });
          }
        });   
      }));

      const failedListJson: {[key: string]: IconFunzinnu} = {};
      for(const dccon of newDcConsData)
      {
        if(dccon.use_origin)
        {
          failedListJson[dccon.name] = dccon;
        }
      }
      await saveJsonIndex(failedListJson, `${basePath}/${FAILED_LIST_FILE}`);
      logger.info(`Save Funzinnu's failed index done! -> ${basePath}/${FAILED_LIST_FILE}`);

      resolve({
        ...jsonData,
        dcConsData: newDcConsData,
      });
    }
    catch(err)
    {
      reject(err);
    }
  });
}


const saveImage = (dccon: IconFunzinnu, savePath: string): Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    try
    {
      /**
       * sleep 해서 타겟 서버 부하 줄이기?
       */
      await sleep(Math.random() * 5000);
      const writer = fs.createWriteStream(savePath);
      /**
       * 어떤 주소는 한글이 포함되어 있고 어떤 주소는 한글이 이미 encode된 것이 있어서
       * 한번 디코딩한 뒤에 인코딩하면 unescaped 에러 없이 요청이 가능함. 
       */
      const res = await axios.get(encodeURI(decodeURI(dccon.uri)), {
        responseType: "stream",
      });
      res.data.pipe(writer);

      writer.on("finish", ()=>{
        logger.debug(`Download image from ${dccon.uri} to ${savePath}`);
        resolve(true);
      });
      writer.on("error", reject);
    }
    catch(err)
    {
      reject(err);
    }
  });
}

const saveJsonIndex = (jsonData: any, savePath: string) => {
  return new Promise(async (resolve, reject) => {
    try
    {
      fs.writeFile(savePath, JSON.stringify(jsonData, null, 2), "utf8", () => {
        resolve(true);
      });
    }
    catch(err)
    {
      reject(err);
    }
  });
}

export default handler;