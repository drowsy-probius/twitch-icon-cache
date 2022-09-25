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
import { getImageSubPaths } from "./functions";
import { createStreamerIconModel } from "../database";
import retry from "async-retry";


/**
 * 사용자가 json파일을 주었을 때 처리
 */
export default class IconIndexProcessor {
  logger: winston.Logger;
  streamer: StreamerData;
  subPaths: ImageSubpaths;

  constructor(streamer: StreamerData)
  {
    this.logger = Logger(`${module.filename} [${streamer.name}]`);
    this.streamer = streamer;
    this.subPaths = getImageSubPaths(streamer.name);
  }

  mkdirImagePaths()
  {
    Object.keys(this.subPaths).forEach((size) => {
      const subPath = this.subPaths[size as ImageSize];
      if (!existsSync(subPath)) mkdirSync(subPath, { recursive: true });
    })
  }

  downloadIndexFromUrl() {
    if(this.streamer.type === 0) return new OpenDccon(this.logger).downloadIndexFromUrl;
    if(this.streamer.type === 1) return new BridgeBBCC(this.logger).downloadIndexFromUrl;
    throw new Error(`Unknown type: ${this.streamer}`);
  }

  async saveToDatabase(iconIndex: IconIndex)
  {
    const Model = createStreamerIconModel(this.streamer.name);
    try 
    {
      await Model.insertMany(iconIndex.icons);
      this.logger.info(`[saveToDatabase] icons are inserted to database`);
    }
    catch(err: any)
    {
      if(err.code === 11000) // dup key error
      {
        this.logger.warn(`[saveToDatabase] duplicated keys error`);
        let icons: Icon[] = [];
        const errorIconsIDs = err.result.result.writeErrors.map(async (error: any) => {
          const parsedError = JSON.stringify(error);
          const icon = JSON.parse(parsedError).op;
          icons.push(icon);
          this.logger.warn(`dup: ${JSON.stringify(icon)}`);
          return icon.hash;
        });

        // 2- removing old duplicates.
        await Model.deleteMany({hash: {'$in': errorIconsIDs}});
        // 3- adding the orders
        try{
          this.logger.warn(JSON.stringify(errorIconsIDs));
          this.logger.warn(JSON.stringify(icons));
          await Model.insertMany(icons);
          return Promise.resolve('Data Inserted');
        }catch (e) {
          return Promise.reject(e);
        }
      }
      else 
      {
        return Promise.reject(err);
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
        this.mkdirImagePaths();
        const processor = new OpenDccon(this.logger);
        processor.downloadIndexFromUrl(this.streamer.url)
        .then((iconIndexRaw: IconIndexOpenDccon) => {
          return processor.formatIconIndex(this.streamer, iconIndexRaw);
        })
        .then((iconIndex: IconIndex) => {
          return this.saveToDatabase(iconIndex);
        })
        .then(() => {
          this.logger.info(`[IconProcessor] Processing icons done! ${JSON.stringify(this.streamer, null, 2)}`);
        });
      }
      else if(this.streamer.type === 1)
      {
        this.logger.info(`[IconProcessor] Processing icons start! ${JSON.stringify(this.streamer, null, 2)}`);
        this.mkdirImagePaths();
        const processor = new BridgeBBCC(this.logger);
        processor.downloadIndexFromUrl(this.streamer.url)
        .then((iconIndexRaw: IconIndexBridgeBBCC) => {
          return processor.formatIconIndex(this.streamer, iconIndexRaw);
        })
        .then((iconIndex: IconIndex) => {
          // this.logger.error(iconIndex.icons.sort((a, b) => parseInt(a.hash, 16) - parseInt(b.hash, 16)));

          return this.saveToDatabase(iconIndex);
        })
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