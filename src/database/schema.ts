import { Schema, model } from "mongoose";
import { StreamerData, Icon } from "../@types/interfaces";
import Logger from "../logger";
const logger = Logger(module.filename);

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


export const iconSchema = new Schema<Icon>({
  hash: { type: String, required: true, unique: true, },
  iconHash: { type: String, required: true, ref: `iconList`},
  name: { type: String, required: true, },
  path: { type: String, }, // evaluated when router called.
  tags: { type: [String], required: true},
  keywords: { type: [String], required: true },

  useOrigin: { type: Boolean, },
  originPath: { type: String, },
}, {
  timestamps: true,
  methods: {
    isOutdated(icon: Icon) {
      if (this.keywords.length !== icon.tags.length)
      {
        logger.debug(`apply update as new keywords are detected. local: ${this.keywords} remote: ${icon.keywords}`);
        return true;
      }
      if (this.tags.length !== icon.tags.length)
      {
        logger.debug(`apply update as new tags are detected. local: ${this.tags} remote: ${icon.tags}`);
        return true;
      }
      if (this.originPath !== icon.originPath)
      {
        logger.debug(`apply update as originPath is different. local: ${this.originPath} remote: ${icon.originPath}`);
        return true;
      }
      for (const keyword of icon.keywords)
      {
        if (!this.keywords.includes(keyword))
        {
          logger.debug(`apply update as some keywords are changed. local: ${this.keywords} remote: ${icon.keywords}`);
          return true;
        }
      }
      for (const tag of icon.tags)
      {
        if (!this.tags.includes(tag))
        {
          logger.debug(`apply update as some tags are changed. local: ${this.tags} remote: ${icon.tags}`);
          return true;
        }
      }

      return false;
    },

    hasKeyword (keyword: string) {
      return this.keywords.includes(keyword);
    },
  },
  
});
iconSchema.pre("validate", function(next){
  this.tags = Array.from(new Set(this.tags)); // remove duplicated items;
  this.keywords = Array.from(new Set(this.keywords)); // remove duplicated items;
  next();
});

export const iconListSchema = new Schema({
  iconHash: { type: String, required: true, unique: true, },
}, {
  timestamps: false,
});