export interface StreamerData {
  name: string,
  url: string,
}

export type IconProcessorFunction = (streamer: StreamerData) => void;

export interface IconProcessorFunctionList {
  [key: string]: IconProcessorFunction
}

export interface IconPrototype {
  name?: string,
  uri?: string, 
  keywords: string[],
  tags: string[],
  [key: string]: any,
}

export interface IconIndexPrototype {
  icons: IconPrototype[],
  [key: string]: any,
}

////////////////////////////////////////////////////////////
// 스트리머 특화 타입

export interface IconFunzinnu extends IconPrototype {
  name: string,
  uri: string, 
  keywords: string[],
  tags: string[],
}

export interface IconIndexFunzinnu extends IconIndexPrototype {
  dcConsData: IconFunzinnu[],
}

//////////

export interface IconYeokka extends IconPrototype {
  path: string,
  keywords: string[],
  tags: string[],
}

export interface IconIndexYeokka extends IconIndexPrototype {
  dccons: IconYeokka[],
}

//////////

export interface IconYelk5093 extends IconPrototype {
  path: string,
  keywords: string[],
  tags: string[],
}

export interface IconIndexYelk5093 extends IconIndexPrototype {
  dccons: IconYelk5093[],
}


////////////////////////////////////////////////////////////

export interface Icon extends IconPrototype{
  name: string,
  uri: string, 
  tags: string[],
  keywords: string[],

  nameHash: string,
  thumbnailUri: string, 
  useOrigin: boolean,
  originUri: string,
};

export interface IconIndex extends IconIndexPrototype{
  icons: Icon[],
  timestamp: number,
}