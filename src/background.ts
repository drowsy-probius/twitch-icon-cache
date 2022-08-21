import sqlite3 from "sqlite3";
import { DATABASE, CACHE_TIME } from "./constants";
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

    this.getStreamersFromDatabase()
    .then((streamers: StreamerData[]) => {
      for(const streamer of streamers)
      {
        this.fetchDataForStreamer(streamer);
      }
    })
    .catch(err => {
      logger.error(err);
    })
  }

  async getStreamersFromDatabase(): Promise<StreamerData[]>
  {
    return new Promise((resolve, reject) => {
      const streamers: StreamerData[] = [];
      const db = new sqlite3.Database(DATABASE);
      db.each("SELECT * FROM streamers;", (err, row) => {
        if(err)
        {
          reject(err);
        }

        streamers.push({
          name: row["name"],
          url: row["url"],
        });
      })
      db.close();

      resolve(streamers);
    });
  }

  fetchDataForStreamer(streamer: StreamerData)
  {
    processorFunctions[streamer.name](streamer);
  }
}