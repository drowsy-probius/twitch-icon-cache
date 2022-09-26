import mongoose, { Schema } from "mongoose";
import Logger from "../logger";
const logger = Logger(module.filename);

export const iconListSchema = new Schema({
  iconHash: { type: String, required: true, unique: true, },
  uploadedBy: { type: String, required: true, },
  referencedBy: { type: [String], required: true, default: [], },
}, {
  timestamps: false,
});
iconListSchema.pre("validate", function(next){
  this.referencedBy = Array.from(new Set(this.referencedBy)); // remove duplicated items;
  next();
});

const iconListModel = mongoose.model(`iconList`, iconListSchema, `iconList`);
export default iconListModel;