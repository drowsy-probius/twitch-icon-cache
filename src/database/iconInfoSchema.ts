import { Schema, PopulatedDoc, ObjectId, Document } from "mongoose";
import { IconInfoSchema, IconSchema } from "../@types/schemas";
import Logger from "../logger";
const logger = Logger(module.filename);

const iconInfoSchema = new Schema<IconInfoSchema>(
  {
    owner: { type: Schema.Types.ObjectId, ref: `streamerList`, required: true },
    icon: { type: Schema.Types.ObjectId, ref: `iconList`, required: true },
    name: { type: String, required: true },
    tags: { type: [String], required: true },
    keywords: { type: [String], required: true },

    useOrigin: { type: Boolean },
    originPath: { type: String },
  },
  {
    timestamps: true,
  }
);

iconInfoSchema.pre("validate", function (next) {
  this.tags = Array.from(new Set(this.tags)); // remove duplicated items;
  this.keywords = Array.from(new Set(this.keywords)); // remove duplicated items;
  next();
});

iconInfoSchema.post("save", function (res) {
  res
    .populate<{ icon: IconSchema }>("icon")
    .then((doc) => {
      const iconDoc = doc.icon as Document<ObjectId> & IconSchema;
      if (iconDoc === null || iconDoc === undefined) return;
      return iconDoc.updateOne({
        $push: { usedBy: doc.owner }
      });
    })
    .catch((err) => {
      logger.error(`iconInfoSchema post save`);
      logger.error(err);
    });
});

iconInfoSchema.pre("deleteOne", function (next) {
  this.populate<{ icon: IconSchema }>("icon")
    .then((doc) => {
      const iconDoc = doc.icon as Document<ObjectId> & IconSchema;
      if (iconDoc === null || iconDoc === undefined) return;
      return iconDoc.updateOne({
        $pull: { usedBy: doc.owner } // 해당 항목만 제거함.
      });
    })
    .catch((err: any) => {
      logger.error(`iconInfoSchema pre deleteOne`);
      logger.error(err);
    })
    .then(() => {
      next();
    });
});

export default iconInfoSchema;
