import mongoose from 'mongoose';
import { Icon } from "../@types/interfaces";
import { streamerListSchema, iconSchema, iconListSchema } from "./schema";

const streamerIconModel: {[streamerName: string]: mongoose.Model<Icon>} = {}

export const streamerListModel = mongoose.model(`streamerList`, streamerListSchema);
export const iconListModel = mongoose.model(`iconList`, iconListSchema);
export const getStreamerIconModel = (streamerName: string) => {
  if(streamerName in streamerIconModel) return streamerIconModel[streamerName];
  const Model = mongoose.model(streamerName, iconSchema);
  streamerIconModel[streamerName] = Model;
  return Model;
}


/**
 * TODO:
 * rest api 만들기
 * 초기 작업 수정하기
 */