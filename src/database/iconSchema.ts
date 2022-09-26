import iconListModel from './iconListSchema';
import mongoose, { Schema, Model, HydratedDocument, Document } from "mongoose";
import { Icon } from "../@types/interfaces";
import Logger from "../logger";
const logger = Logger(module.filename);

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
  statics: {
    isOutdated(icon: Icon) {
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
iconSchema.pre("validate", function(next){
  this.tags = Array.from(new Set(this.tags)); // remove duplicated items;
  this.keywords = Array.from(new Set(this.keywords)); // remove duplicated items;
  next();
});
iconSchema.post("save", async function(doc: HydratedDocument<Icon>){
  logger.warn(`[iconSchema] save post hook called`);
  
  const collectionName = doc.collection.collectionName;
  if(collectionName === null) return;
  const iconDoc = await iconListModel.findOne({ iconHash: doc.iconHash });
  if(iconDoc === null) return;
  iconDoc.referencedBy = [...iconDoc.referencedBy, collectionName];
  iconDoc.save();
});
iconSchema.post("insertMany", function(docs: HydratedDocument<Icon>[]){
  logger.warn(`[iconSchema] insertMany post hook called`);
  
  if(docs.length === 0) return;
  docs.forEach(async (doc: HydratedDocument<Icon>) => {
    const collectionName = doc.collection.collectionName;
    if(collectionName === null) return;
    const iconDoc = await iconListModel.findOne({ iconHash: doc.iconHash });
    if(iconDoc === null) return;
    iconDoc.referencedBy = [...iconDoc.referencedBy, collectionName];
    iconDoc.save();
  });
});
iconSchema.post("remove", async function(doc: HydratedDocument<Icon>){
  logger.warn(`[iconSchema] remove post hook called`);

  const collectionName = doc.collection.collectionName;
  if(collectionName === null) return;
  const iconDoc = await iconListModel.findOne({ iconHash: doc.iconHash });
  if(iconDoc === null) return;
  iconDoc.referencedBy = iconDoc.referencedBy.filter(ref => ref != collectionName);
  iconDoc.save();
});



const streamerIconModel: {[streamerName: string]: mongoose.Model<Icon>} = {}
const getStreamerIconModel = (streamerName: string) => {
  if(streamerName in streamerIconModel) return streamerIconModel[streamerName];
  const Model = mongoose.model(streamerName, iconSchema, streamerName);
  streamerIconModel[streamerName] = Model;
  return Model;
}
export default getStreamerIconModel;
