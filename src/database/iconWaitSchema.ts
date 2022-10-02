import { Schema } from 'mongoose';
import { IconWaitSchema } from '../@types/schemas';


const iconWaitSchema = new Schema<IconWaitSchema>(
  {
    // uploader
    uploader: { type: Schema.Types.ObjectId, ref: `streamerList`, required: true },

    // icon info
    fieldname: { type: String, required: true, },
    originalname: { type: String, required: true, },
    encoding: { type: String, required: true, },
    mimetype: { type: String, required: true, },
    destination: { type: String, required: true, },
    filename: { type: String, required: true, },
    path: { type: String, required: true, },
    size: { type: Number, required: true, },
    hash: { type: String, rquired: true, },

    // icon metadata info
    iconName: { type: String, require: true, },
    iconKeywords: { type: [String], require: true, },
    iconTags: { type: [String], require: true, },
  },
  {
    timestamps: true,
  }
)

export default iconWaitSchema;