export interface StreamerData {
  name: string,
  url: string,
}

export type IconProcessorFunction = (streamer: StreamerData) => void;

export interface IconProcessorFunctionList {
  [key: string]: IconProcessorFunction
}

export interface IconIndexFunzinnu extends JSON {
  icons: {
    name: string,
    uri: string, 
    keywords: string[],
    tags: string[],
  }[],
}


export interface Icon {
  name: string,
  nameHash: string,
  uri: string, 
  thumbnailUri: string, 
  keywords: string[],
  tags: string[],
  useOrigin: boolean,
  originUri: string,
};

export interface IconIndex
{
  icons: Icon[],
  timestamp: number,
}