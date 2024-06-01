import { resolve, join } from 'path';
import fs from 'fs';

import { CACHE_TIME, INDEX_FILE } from './constants';
import { STREAMER_DATA } from './data';
import { timeParser, doUpdateJson, getImageBasePath } from './functions';
import { IconIndex } from './@types/interfaces';
import processorFunctions, { indexDownloader } from './iconProcessor';

import Logger from './Logger';
const logger = Logger(module.filename);

/**
 * 외부에서 cronjob 실행하는 함수
 * @returns Cronjob
 */
export const run_cronjob = (): Cronjob => {
  const cronjob = new Cronjob();
  return cronjob;
};

class Cronjob {
  lastTime: Date;
  cacheTime: number;
  timerIdentifier: NodeJS.Timer;

  constructor() {
    // 마지막으로 실행한 날짜
    this.lastTime = new Date();
    // 설정에서 읽어온 캐시 시간 (새고로침 간격)
    this.cacheTime = timeParser(CACHE_TIME);

    // 작업 수행
    setTimeout(this.job, 0);
    // 캐시 시간마다 작업을 수행하도록 설정
    this.timerIdentifier = setInterval(this.job, this.cacheTime);
  }

  async job() {
    logger.info(`execute cronjob on ${new Date().toString()}`);

    for (const streamer of STREAMER_DATA) {
      try {
        // 로컬에 저장되어있을 이미지 정보 json 파일 경로
        const jsonPath = resolve(
          join(getImageBasePath(streamer.name.twitch), INDEX_FILE)
        );
        // 로컬에 저장되어 있는 json파일이 있으면 업데이트할 지 결정함.
        if (fs.existsSync(jsonPath)) {
          // 이미지 정보 json 파일 읽음.
          const data = fs.readFileSync(jsonPath, 'utf8');
          // json으로 파싱
          const json: IconIndex = JSON.parse(data);
          // 로컬 json에 다운받았을 때 시간 정보
          const timestamp = json.timestamp;
          /**
           * 캐시 시간보다 작으면 정보를 새로 다운로드 하지 않음.
           * 로컬 시간 값을 먼저 비교하는 이유는 최대한 원본 서버에 부하를 줄이기 위함.
           */
          if (Date.now() - timestamp <= this.cacheTime) {
            logger.info(
              `[Cronjob] ${streamer.name.twitch}'s data is up-to-date by timestamp. Skip downloading...`
            );
            continue;
          }

          // 로컬의 icons값과 원격에서 가져온 icons값을 정해진 함수로 비교함.
          if (
            !doUpdateJson(
              json.icons,
              await indexDownloader[streamer.type](streamer.url)
            )
          ) {
            logger.info(
              `[Cronjob] ${streamer.name.twitch}'s data is up-to-date by compare function. Skip downloading...`
            );
            continue;
          }
        }

        // 원격 서버에 새로운 데이터가 있다고 판단되어 새로 다운함.
        processorFunctions(streamer);
      } catch (e) {
        logger.error(e);
      }
    }
  }
}
