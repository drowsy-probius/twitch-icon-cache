import { Schema, HydratedDocument } from "mongoose";
import { IconInfoSchema, StreamerSchema } from "../@types/schemas";
import Logger from "../logger";
const logger = Logger(module.filename);

const iconInfoSchema = new Schema<IconInfoSchema>({
  owner: { type: Schema.Types.ObjectId, ref: `streamerList`, required: true, },
  icon: { type: Schema.Types.ObjectId, ref: `iconList`, required: true, },
  name: { type: String, required: true, },
  tags: { type: [String], required: true, },
  keywords: { type: [String], required: true, },

  useOrigin: { type: Boolean, },
  originPath: { type: String, },
}, {
  timestamps: true,
  statics: {
    isOutdated(icon: IconInfoSchema) {
      // if (this.keywords.length !== icon.tags.length)
      // {
      //   logger.debug(`apply update as new keywords are detected. local: ${this.keywords} remote: ${icon.keywords}`);
      //   return true;
      // }
      // if (this.tags.length !== icon.tags.length)
      // {
      //   logger.debug(`apply update as new tags are detected. local: ${this.tags} remote: ${icon.tags}`);
      //   return true;
      // }
      // if (this.originPath !== icon.originPath)
      // {
      //   logger.debug(`apply update as originPath is different. local: ${this.originPath} remote: ${icon.originPath}`);
      //   return true;
      // }
      // for (const keyword of icon.keywords)
      // {
      //   if (!this.keywords.includes(keyword))
      //   {
      //     logger.debug(`apply update as some keywords are changed. local: ${this.keywords} remote: ${icon.keywords}`);
      //     return true;
      //   }
      // }
      // for (const tag of icon.tags)
      // {
      //   if (!this.tags.includes(tag))
      //   {
      //     logger.debug(`apply update as some tags are changed. local: ${this.tags} remote: ${icon.tags}`);
      //     return true;
      //   }
      // }

      return false;
    },

    hasKeyword (keyword: string) {
      // return this.keywords.includes(keyword);
      return false;
    },
  }
  
});
iconInfoSchema.pre("validate", function(next){
  this.tags = Array.from(new Set(this.tags)); // remove duplicated items;
  this.keywords = Array.from(new Set(this.keywords)); // remove duplicated items;
  next();
});

export default iconInfoSchema;
