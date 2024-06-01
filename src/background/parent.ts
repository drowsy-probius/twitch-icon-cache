import { CACHE_TIME } from '../constants';
import { timeParser } from '../functions';

import Logger from '../Logger';
import { ChildProcess, fork } from 'child_process';
import { ChildMessage } from './types';
import { existsSync } from 'fs';

const logger = Logger(module.filename);

const getChildProcess = async (): Promise<ChildProcess> => {
  return new Promise((resolve, reject) => {
    let child: ChildProcess;
    if (existsSync(`${__dirname}/child.js`)) {
      child = fork(`${__dirname}/child.js`);
    }
    child = fork(`${__dirname}/child.ts`, [], {
      execArgv: ['-r', 'ts-node/register'],
    });

    child.on('message', (message: ChildMessage) => {
      logger.debug(message);
      const { result } = message;
      if (result === 'init') {
        resolve(child);
      }
    });

    child.on('exit', (code, signal) => {
      logger.debug(
        `Child process exited with code ${code} and signal ${signal}`
      );
    });
  });
};

/**
 * 외부에서 cronjob 실행하는 함수
 * @returns Cronjob
 */
export const run_cronTask = (): NodeJS.Timeout => {
  const job = async () => {
    const childProcess: ChildProcess = await getChildProcess();

    childProcess.on('error', error => {
      logger.error(error);
    });

    childProcess.send({
      command: 'cron',
    });
  };

  const cacheTime = timeParser(CACHE_TIME);

  setTimeout(job, 0);
  // 캐시 시간마다 작업을 수행하도록 설정
  const timerIdentifier = setInterval(job, cacheTime);

  return timerIdentifier;
};

export const run_refreshTask = async (streamer: string) => {
  const childProcess = await getChildProcess();

  childProcess.on('error', error => {
    logger.error(error);
  });

  childProcess.send({
    command: 'refresh',
    args: {
      streamer,
    },
  });
};
