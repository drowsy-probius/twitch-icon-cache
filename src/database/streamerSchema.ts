import { Schema } from "mongoose";
import { StreamerSchema } from "../@types/schemas";

/**
 * openDccon
 *
 * {"dccons": [{
 *
 *  path: string, // 상대경로, 절대경로 체크 해야 함.
 *
 *  keywords: string[],
 *
 *  tags: string[],
 *
 * }]}
 *
 * https://open-dccon-selector.update.sh/api/dccon-url?channel_name=
 * 를 통헤서 얻을 수 있음.
 *
 *
 * BridgeBBCC
 *
 * dcConsData = [{
 *
 *  name: string,
 *
 *  keywords: string[],
 *
 *  tags: string[],
 *
 *  // 옵션임.
 *  // 없다면 example.com/images/name 또는 example.com/images/dccon/name
 *  uri?: string,
 *
 * }]
 */

const streamerSchema = new Schema<StreamerSchema>(
  {
    id: { type: Number, required: true, unique: true }, // twitch number id
    name: { type: String, required: true, unique: true }, // twitch id
    nickname: { type: String, required: true }, // twitch nickname

    url: { type: String }, // opendccon or bridgebbcc url
    imagePrefix: { type: String }, // use when url is provided.
    type: { type: Number }, // opendccon or bridgebbcc

    lastUpdatedDate: { type: Date },
  },
  {
    timestamps: true,
    methods: {},
  }
);

export default streamerSchema;
