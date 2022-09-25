import { resolve, join } from "path";
import fs from "fs";

import { CACHE_TIME, INDEX_FILE } from "./constants";
import { STREAMER_DATA } from "./data";
import { timeParser, doUpdateJson } from "./functions";
import { IconIndex } from "./@types/interfaces";
import IconIndexProcessor from "./iconIndexProcessor";

import Logger from "./logger";
const logger = Logger(module.filename);

/**
 * 외부에서 cronjob 실행하는 함수
 * @returns Cronjob
 */
export const run_cronjob = (): Cronjob => {
  const cronjob = new Cronjob();
  return cronjob;
}

class Cronjob
{
  lastTime: Date;
  cacheTime: number;
  timerIdentifier: NodeJS.Timer;

  constructor()
  {
    // 마지막으로 실행한 날짜
    this.lastTime = new Date();
    // 설정에서 읽어온 캐시 시간 (새고로침 간격)
    this.cacheTime = timeParser(CACHE_TIME);

    // 작업 수행
    this.job()
    // 캐시 시간마다 작업을 수행하도록 설정
    this.timerIdentifier = setInterval(this.job, this.cacheTime);
  }

  job()
  {
    logger.info(`execute cronjob on ${(new Date()).toString()}`);
    STREAMER_DATA.forEach(async streamer => {
      const processor = new IconIndexProcessor(streamer);
      processor.run();      
    });
  }
}