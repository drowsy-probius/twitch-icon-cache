export interface StreamerData {
  name: string,
  url: string,
}

export type IconProcessorFunction = (streamer: StreamerData) => void;

export interface IconProcessorFunctionList {
  [key: string]: IconProcessorFunction
}

export interface IconPrototype {
  name: string,
  uri: string, 
  keywords: string[],
  tags: string[],
  [key: string]: any,
}

export interface IconIndexPrototype {
  icons: IconPrototype[],
  [key: string]: any,
}

export interface IconIndexFunzinnu extends IconIndexPrototype {
  icons: {
    name: string,
    uri: string, 
    keywords: string[],
    tags: string[],
  }[],
}


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