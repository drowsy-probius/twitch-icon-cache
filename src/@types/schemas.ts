import { PopulatedDoc, ObjectId } from "mongoose";

export interface StreamerSchema {
  id: number,
  name: string,
  nickname: string,

  url?: string,
  imagePrefix?: string,
  type?: number,
  lastUpdatedDate?: Date,
}

export interface IconSchema {
  iconHash: string,
  uploadedBy: PopulatedDoc<StreamerSchema>,
  usedBy: PopulatedDoc<StreamerSchema>[],
}

export interface IconInfoSchema {
  owner: PopulatedDoc<StreamerSchema>,
  icon: PopulatedDoc<IconSchema>,
  name: string,
  tags: string[],
  keywords: string[],

  useOrigin?: boolean,
  originPath?: boolean,
}

