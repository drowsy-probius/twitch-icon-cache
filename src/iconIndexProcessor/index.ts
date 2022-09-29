import { mkdirSync } from 'fs';
import winston from 'winston';
import OpenDccon from './opendccon';
import BridgeBBCC from './bridgebbcc';

import {
  StreamerData,
  ImageSubpaths,
  ImageSize,
  Icon,
  IconIndex, 
  IconIndexOpenDccon, 
  IconIndexBridgeBBCC
} from "../@types/interfaces";
import Logger from "../logger";
import { existsSync } from 'fs';
import { getImageSubPaths } from "../functions";
import { 
  StreamerListModel,
  IconInfoListModel,
  IconListModel
} from "../database";
import retry from "async-retry";


const subPaths = getImageSubPaths();
Object.keys(subPaths).forEach((size) => {
  const subPath = subPaths[size as ImageSize];
  if (!existsSync(subPath)) mkdirSync(subPath, { recursive: true });
})


/**
 * 사용자가 json파일을 주었을 때 처리
 */
export default class IconIndexProcessor {
  logger: winston.Logger;
  streamer: StreamerData;

  constructor(streamer: StreamerData)
  {
    this.logger = Logger(`${module.filename} [${streamer.name}]`);
    this.streamer = streamer;
  }

  downloadIndexFromUrl() {
    if(this.streamer.type === 0) return new OpenDccon(this.logger).downloadIndexFromUrl;
    if(this.streamer.type === 1) return new BridgeBBCC(this.logger).downloadIndexFromUrl;
    throw new Error(`Unknown type: ${this.streamer}`);
  }

  async saveToDatabase(iconIndex: IconIndex)
  {
    const streamerDoc = await StreamerListModel.findOne({name: this.streamer.name});
    try 
    {
      if(streamerDoc === null)
      {
        throw new Error(`${this.streamer.name} is not exists in streamerList database.`);
      }

      const icons = await Promise.all(iconIndex.icons.map(async (icon: Icon) => {
        const iconDoc = await IconListModel.findOne({iconHash: icon.iconHash});
        if(iconDoc === null)
        {
          throw new Error(`${JSON.stringify(icon, null, 2)} is not exists in streamerList database.`);
        }
        await iconDoc.update({ usedBy: Array.from(new Set([...iconDoc.usedBy, streamerDoc._id])) });
        await iconDoc.save();

        return {
          owner: streamerDoc._id,
          icon: iconDoc._id,
          ...icon,
        }
      }));

      await IconInfoListModel.insertMany(icons);
      this.logger.info(`[saveToDatabase] Total ${icons.length} icons are inserted to database`);
    }
    catch(err: any)
    {
      if(err.code === 11000) // dup key error
      {
        this.logger.warn(`[saveToDatabase] duplicated keys error`);
        const icons: Icon[] = [];
        const errorIconObjectIds = err.result.result.writeErrors.map((error: any) => {
          const parsedError = JSON.stringify(error);
          const icon = JSON.parse(parsedError).op;
          icons.push(icon);
          this.logger.warn(`dup: ${JSON.stringify(icon)}`);
          return icon.icon;
        });

        // 2- removing old duplicates.
        await IconInfoListModel.deleteMany({icon: {'$in': errorIconObjectIds}});
        // 3- adding the orders
        await IconInfoListModel.insertMany(icons);
      }
      else 
      {
        throw err;
      }
    }

  }

  async run()
  {
    try 
    {
      if(this.streamer.url === undefined)
      {
        throw new Error(`url is undefined: ${JSON.stringify(this.streamer, null, 2)}`);
      }

      if(this.streamer.type === 0)
      {
        this.logger.info(`[IconProcessor] Processing icons start! ${JSON.stringify(this.streamer, null, 2)}`);
        const processor = new OpenDccon(this.logger);
        processor.downloadIndexFromUrl(this.streamer.url)
        .then((iconIndexRaw: IconIndexOpenDccon) => processor.formatIconIndex(this.streamer, iconIndexRaw))
        .then((iconIndex: IconIndex) => this.saveToDatabase(iconIndex))
        .then(() => {
          this.logger.info(`[IconProcessor] Processing icons done! ${JSON.stringify(this.streamer, null, 2)}`);
        });
      }
      else if(this.streamer.type === 1)
      {
        this.logger.info(`[IconProcessor] Processing icons start! ${JSON.stringify(this.streamer, null, 2)}`);
        const processor = new BridgeBBCC(this.logger);
        processor.downloadIndexFromUrl(this.streamer.url)
        .then((iconIndexRaw: IconIndexBridgeBBCC) => processor.formatIconIndex(this.streamer, iconIndexRaw))
        .then((iconIndex: IconIndex) => this.saveToDatabase(iconIndex))
        .then(() => {
          this.logger.info(`[IconProcessor] Processing icons done! ${JSON.stringify(this.streamer, null, 2)}`);
        });
      }
      else 
      {
        throw new Error(`Unknown type: ${JSON.stringify(this.streamer, null, 2)}`);
      }
    }
    catch(err)
    {
      this.logger.error(err);
    }
  }
}