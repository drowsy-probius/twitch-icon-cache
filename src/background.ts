import { CACHE_TIME } from "./constants";
import { STREAMER_DATA } from "./data";
import { timeParser } from "./functions";
import { StreamerData } from "./@types/interfaces";
import processorFunctions from "./iconProcessor";

import Logger from "./logger";
const logger = Logger(module.filename);

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
    this.lastTime = new Date();
    this.cacheTime = timeParser(CACHE_TIME);

    this.job()
    this.timerIdentifier = setInterval(this.job, timeParser("1d"));
  }

  async job()
  {
    logger.info(`execute cronjob on ${(new Date()).toString()}`)

    STREAMER_DATA.forEach(streamer => {
      this.fetchDataForStreamer(streamer);
    });
  }

  fetchDataForStreamer(streamer: StreamerData)
  {
    /** */
    logger.info(`this function (fetchDataForStreamer()) disabled manually for development. uncomment this when production`);
    return;
    /** */

    processorFunctions[streamer.name](streamer);
  }
}