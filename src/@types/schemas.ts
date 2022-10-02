import { PopulatedDoc } from "mongoose";

export interface StreamerSchema {
  id: number;
  name: string;
  nickname: string;
  penalty: number,

  url?: string;
  imagePrefix?: string;
  type?: number;
  lastUpdatedDate?: Date;
}

export interface IconSchema {
  iconHash: string;
  uploadedBy: PopulatedDoc<StreamerSchema>;
  usedBy: PopulatedDoc<StreamerSchema>[];
}

export interface IconInfoSchema {
  owner: PopulatedDoc<StreamerSchema>;
  icon: PopulatedDoc<IconSchema>;
  name: string;
  tags: string[];
  keywords: string[];

  useOrigin?: boolean;
  originPath?: boolean;
}

export interface IconWaitSchema {
  uploader: PopulatedDoc<StreamerSchema>,
  fieldname: string,
  originalname: string,
  encoding: string,
  mimetype: string,
  destination: string,
  filename: string,
  path: string,
  size: number,
  hash: string,

  iconName: string,
  iconKeywords: string[],
  iconTags: string[],
}