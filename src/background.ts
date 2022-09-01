import { resolve } from "path";
import fs from "fs";
import axios from "axios";

import { CACHE_TIME, INDEX_FILE, INDEX_ORIGIN_FILE } from "./constants";
import { STREAMER_DATA } from "./data";
import { timeParser, doUpdateJson, saveRawFile } from "./functions";
import { IconIndex, StreamerData } from "./@types/interfaces";
import processorFunctions, { indexDownloader } from "./iconProcessor";

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
    this.timerIdentifier = setInterval(this.job, this.cacheTime);
  }

  job()
  {
    logger.info(`execute cronjob on ${(new Date()).toString()}`);

    STREAMER_DATA.forEach(async streamer => {
      this.downloadOriginJson(streamer);
      const jsonPath = resolve(`./images/${streamer.name}/${INDEX_FILE}`);
      if(fs.existsSync(jsonPath))
      {
        const data = fs.readFileSync(jsonPath, "utf8");
        const json: IconIndex = JSON.parse(data);
        const timestamp = json.timestamp;
        if((Date.now() - timestamp) <= this.cacheTime)
        {
          logger.info(`[Cronjob] ${streamer.name}'s data is up-to-date by timestamp. Skip downloading...`);
          return;
        }

        if(!doUpdateJson(json.icons, (await indexDownloader[streamer.name](streamer.url)).icons))
        {
          logger.info(`[Cronjob] ${streamer.name}'s data is up-to-date by compare function. Skip downloading...`);
          return;
        }
      }

      logger.info(`[Cronjob] ${streamer.name}'s data is outdated. Downloading...`);
      this.fetchDataForStreamer(streamer);
    });
  }

  fetchDataForStreamer(streamer: StreamerData)
  {
    processorFunctions[streamer.name](streamer);
  }

  async downloadOriginJson(streamer: StreamerData)
  {
    const jsonOriginPath = resolve(`./images/${streamer.name}/${INDEX_ORIGIN_FILE}`);
    const res = await axios.get(`${streamer.url}${streamer.url.includes("?") ? "&" : "?"}ts=${Date.now()}`);
    await saveRawFile(res.data, jsonOriginPath);
  }
}