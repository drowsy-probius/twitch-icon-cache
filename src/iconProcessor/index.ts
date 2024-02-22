import {
  indexDownloader as openDcconIndexDownloader, 
  processor as openDcconProcessor,
} from "./opendccon";
import {
  indexDownloader as bridgeBBCCIndexDownloader, 
  processor as bridgeBBCCProcessor
} from "./bridgebbcc";

import { StreamerData } from "../@types/interfaces";

import Logger from "../Logger";


/**
 * index.json파일만 다운로드 하는 함수
 * 새 데이터 확인을 위해서 따로 export했음.
 */
export const indexDownloader = [
  openDcconIndexDownloader,
  bridgeBBCCIndexDownloader,
]


/**
 * index.json을 다운로드 및 생성.
 * 이미지 다운로드 및 resize.
 * fail.json 생성.
 */
export default async (streamer: StreamerData): Promise<void> => {
  const logger = Logger(`${module.filename} [${streamer.name}]`);
  logger.info(`Downloading icons from ${streamer.url}`);

  try
  {
    if(streamer.type === 0)
    {
      await openDcconProcessor(
        streamer,
        await openDcconIndexDownloader(streamer.url)
        );
    }
    else if(streamer.type === 1)
    {
      await bridgeBBCCProcessor(
        streamer,
        await bridgeBBCCIndexDownloader(streamer.url)
        );
    }
    else 
    {
      throw new Error(`Unknown type: ${streamer}`)
    }
  }
  catch(err)
  {
    logger.error(err);
  }  
};