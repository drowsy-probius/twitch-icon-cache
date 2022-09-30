import mongoose from "mongoose";
import iconSchema from "./iconSchema";
import streamerSchema from "./streamerSchema";
import iconInfoSchema from "./iconInfoSchema";

const StreamerListModel = mongoose.model(
  `streamerList`,
  streamerSchema,
  `streamerList`
);
const IconListModel = mongoose.model(`iconList`, iconSchema, `iconList`);
const IconInfoListModel = mongoose.model(
  `iconInfo`,
  iconInfoSchema,
  `iconInfo`
);

export { StreamerListModel, IconListModel, IconInfoListModel };
