import { REFRESH_INTERVAL } from "./constants";
import { StreamerData } from './@types/interfaces';
import { timeParser } from "./functions";
import IconIndexProcessor from "./iconIndexProcessor";
import { StreamerListModel } from "./database";

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
  refreshInterval: number;
  timerIdentifier: NodeJS.Timer;

  constructor()
  {
    // 마지막으로 실행한 날짜
    this.lastTime = new Date();
    // 설정에서 읽어온 캐시 시간 (새고로침 간격)
    this.refreshInterval = timeParser(REFRESH_INTERVAL);

    // 작업 수행
    this.job();
    // 캐시 시간마다 작업을 수행하도록 설정
    this.timerIdentifier = setInterval(this.job, this.refreshInterval);
  }

  async job()
  {
    logger.info(`execute cronjob on ${(new Date()).toString()}`);

    /**
     * TEST INSERTION CODE
     */
    try 
    {
      await StreamerListModel.insertMany([
        {
          name: "funzinnu",
          id: 49469880,
          url: "https://api.probius.dev/twitch-icons/cdn/list/open-dccon/funzinnu", // image collision exists: 케이크가게, 쿠기가게
          imagePrefix: "https://api.probius.dev/twitch-icons/cdn/",
          type: 0,
          nickname: "펀즈",
        },
        {
          name: "yeokka",
          id: 124535126,
          url: "https://api.probius.dev/twitch-icons/cdn/list/open-dccon/yeokka",
          imagePrefix: "https://api.probius.dev/twitch-icons/cdn/",
          type: 0,
          nickname: "여까",
        },
        {
          name: "telk5093",
          id: 106620687,
          url: "https://api.probius.dev/twitch-icons/cdn/list/open-dccon/telk5093", // image collision exists: 북한앵무
          imagePrefix: "https://api.probius.dev/twitch-icons/cdn/",
          type: 0,
          nickname: "텔크",
        },
        {
          name: "sleeping_ce",
          id: 414759894,
          url: "https://api.probius.dev/twitch-icons/cdn/list/open-dccon/sleeping_ce",
          imagePrefix: "https://api.probius.dev/twitch-icons/cdn/",
          type: 0,
          nickname: "잠자는꼬마선충"
        },
      ]);
    }
    catch(e) { console.error(e) }

    const streamerData = await StreamerListModel.find();
    streamerData.forEach((streamer: StreamerData) => {
      setTimeout(async () => {
        const processor = new IconIndexProcessor(streamer);
        await processor.run();   
      }, 0);
    });
  }
}