import mongoose from "mongoose";
import iconSchema from "./iconSchema";
import streamerSchema from "./streamerSchema";
import iconInfoSchema from "./iconInfoSchema";
import iconWaitSchema from "./iconWaitSchema";

/**
 * db모델을 사용해야 한다면 무조건 여기에서 export한
 * 것을 사용해야 함.
 * 임의로 새 연결을 만들면 에러 발생할 수 있음.
 */


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
const IconWaitListModel = mongoose.model(`iconWait`, iconWaitSchema, `iconWait`);

export { 
  StreamerListModel, 
  IconListModel, 
  IconInfoListModel, 
  IconWaitListModel,
};
