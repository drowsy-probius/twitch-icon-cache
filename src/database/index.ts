import mongoose from 'mongoose';
import { streamerListSchema, iconSchema } from "./schema";

export const StreamerList = mongoose.model("StreamerList", streamerListSchema);

export const createStreamerIconModel = (streamer_name: string) => {
  return mongoose.model(streamer_name, iconSchema);
}

/**
 * TODO:
 * rest api 만들기
 * 초기 작업 수정하기
 */