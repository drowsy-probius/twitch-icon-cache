import { join, resolve } from 'path';
import fs from 'fs';

import Logger from '../Logger';
import { STREAMER_DATA } from '../data';
import { doUpdateJson, getImageBasePath, timeParser } from '../functions';
import { CACHE_TIME, INDEX_FILE } from '../constants';
import { IconIndex, StreamerData } from '../@types/interfaces';
import processorFunctions, { indexDownloader } from '../iconProcessor';
import { ParentMessage } from './types';

const logger = Logger(module.filename);
logger.debug('CHILD SPAWN');

const cronTask = (() => {
  const cacheTime = timeParser(CACHE_TIME);

  return async function () {
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
          if (Date.now() - timestamp <= cacheTime) {
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
        await processorFunctions(streamer);
      } catch (e) {
        logger.error(e);
      }
    }
  };
})();

const refreshTask = (() => {
  return async function (streamer: string) {
    const streamerData: StreamerData = STREAMER_DATA.filter(d =>
      Object.values(d.name).includes(streamer)
    )[0];
    await processorFunctions(streamerData);
  };
})();

if (process.send) {
  process.send({ result: 'init' });
}

process.on('message', async (message: ParentMessage) => {
  logger.debug(message);
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const { command, args } = message;
  if (command === 'cron') {
    try {
      await cronTask();
    } catch (e) {
      logger.error(e);
    } finally {
      process.exit();
    }
  }

  if (command === 'refresh') {
    const streamer = (args as Record<string, string>).streamer;

    try {
      await refreshTask(streamer);
    } catch (e) {
      logger.error(e);
    } finally {
      process.exit();
    }
  }
});
