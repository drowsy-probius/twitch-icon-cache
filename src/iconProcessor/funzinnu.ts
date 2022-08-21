import axios from "axios";
import fs from "fs";
import { resolve } from "path";

import { IconFunzinnu, IconIndexFunzinnu, IconProcessorFunction, StreamerData } from "../@types/interfaces"

import { DATABASE } from "../constants";
import { sleep } from "../functions";

import Logger from "../logger";
const logger = Logger(module.filename);

const basePath = resolve("./images/funzinnu");

const handler: IconProcessorFunction = async (streamer: StreamerData) => {
  logger.info(`Download icons for ${streamer.name} with ${streamer.url}`);

  if(!fs.existsSync(basePath)) fs.mkdirSync(basePath);
  
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
    await saveJsonIndex(newJsonData, `${basePath}/index.json`);
    logger.info(`Save Funzinnu's Index done! -> ${basePath}/index.json`);
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

          try 
          {
            await saveImage(dccon, newDcCon.uri);
          }
          catch(err)
          {
            logger.error(err);
            logger.error(dccon);
            resolve({
              ...newDcCon,
              use_origin: true
            })
          }

          resolve(newDcCon);
        });   
      }));

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

const saveImage = (dccon: IconFunzinnu, savePath: string, tries=1) => {
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
        // logger.info(`Download image from ${dccon.uri} to ${savePath}`);
        resolve(true);
      });
      writer.on("error", async (err)=>{
        if(tries > 3) 
        {
          // fs.rmSync(savePath);
          reject(err);
        }
        logger.error(`try#${tries} - ${dccon.uri} - ${savePath} : ${err}`);
        await saveImage(dccon, savePath, tries+1);
      });
    }
    catch(err)
    {
      if(tries > 3) 
      {
        reject(err);
      }
      logger.error(`try#${tries} - ${dccon.uri} - ${savePath} : ${err}`);
      await saveImage(dccon, savePath, tries+1);
    }
  });
}

const saveJsonIndex = (jsonData: IconIndexFunzinnu, savePath: string) => {
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