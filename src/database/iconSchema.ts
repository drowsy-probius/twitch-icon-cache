import { Schema } from "mongoose";
import { IconSchema } from "../@types/schemas";
import Logger from "../logger";
const logger = Logger(module.filename);

const iconSchema = new Schema<IconSchema>(
  {
    iconHash: { type: String, required: true, unique: true },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: `streamerList`,
      required: true,
    },
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

export default iconSchema;
