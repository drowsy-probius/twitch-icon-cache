import mongoose, { Schema } from "mongoose";
import { StreamerData } from "../@types/interfaces";

export const streamerListSchema = new Schema<StreamerData>({
  name: { type: String, required: true, unique: true, }, // twitch id
  nickname: { type: String, required: true, },  // twitch nickname
  id: { type: Number, required: true, },  // twitch number id 

  url: { type: String, }, // opendccon or bridgebbcc url
  imagePrefix: {type: String, }, // use when url is provided.
  type: { type: Number, }, // opendccon or bridgebbcc 
  lastUpdatedDate: { type: Date, }
}, {
  timestamps: true,
  methods: {
  },
});

const streamerListModel = mongoose.model(`streamerList`, streamerListSchema, `streamerList`);
export default streamerListModel;