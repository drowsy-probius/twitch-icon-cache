import { Query, Schema, Document, Model, HydratedDocument } from "mongoose";
import { IconSchema } from "../@types/schemas";
import { deleteIcon } from "../iconIndexProcessor/functions";
import Logger from "../logger";
const logger = Logger(module.filename);

type IconModelQuery = Query<Document<Schema.Types.ObjectId, any, IconSchema>, HydratedDocument<IconSchema>, any>;

const iconSchema = new Schema<IconSchema>(
  {
    iconHash: { type: String, required: true, unique: true },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: `streamerList`,
      required: true,
    },
    usedBy: { // 한 스트리머가 여러 개의 iconInfo Document로 여러 개의 icon을 참조하지 못하도록 함.
      type: [{ type: Schema.Types.ObjectId, ref: `streamerList` }],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

iconSchema.pre(/findOneAndUpdate|updateOne|save/, function(next){
  this.usedBy = Array.from(new Set(this.usedBy)); // remove duplicated items;
  next();
})

iconSchema.post(/findOneAndUpdate|updateOne/, async function () {
  const query = (this as unknown) as IconModelQuery & { _conditions: any };
  const doc: HydratedDocument<IconSchema> | null = await query.model.findOne(query._conditions);
  if(doc !== null && doc.usedBy.length === 0)
  {
    try
    {
      logger.debug(`delete icon due to referenced by none`);
      logger.debug(doc.toJSON());
      doc.deleteOne();
      deleteIcon(doc.iconHash, logger);
    }
    catch(err)
    {
      logger.error(`iconSchema pre update`);
      logger.error(err);
    }
  }
  return;
});

export default iconSchema;
