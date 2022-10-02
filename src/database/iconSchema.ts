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
    /**
     * 제한사항
     * 하나의 스트리머의 iconInfoList에서 여러 개의 iconInfo가 하나의 icon을 가리키도록 하면 안됨.
     * 그렇게 하지 않으면 icon이 참조되는데도 usedBy에 streamer ObjectId가 존재하지 않을 수 있음.  
     */
    usedBy: { 
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
  /**
   * 타입 정하는게 어려웠는데 이게 맞는 지 확실하지 않다.
   */
  const query = (this as unknown) as IconModelQuery & { _conditions: any };
  // _conditions에 icon ObjectId가 담겨있어야 함.
  const doc: HydratedDocument<IconSchema> | null = await query.model.findOne(query._conditions);
  if(doc !== null && doc.usedBy.length === 0)
  {
    try
    {
      logger.debug(`delete icon due to referenced by none`);
      logger.debug(doc.toJSON());
      doc.deleteOne();
      // 로컬에 저장된 이미지 모두 제거
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
