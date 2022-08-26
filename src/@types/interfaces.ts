export interface StreamerData {
  name: string,
  url: string,
}

export type IconProcessorFunction = (streamer: StreamerData) => void;

export interface IconProcessorFunctionList {
  [key: string]: IconProcessorFunction
}

export interface IconFunzinnu {
  name: string,
  uri: string, 
  keywords: string[],
  tags: string[],
  thumbnailUri?: string, 
  useOrigin?: boolean,
  originUri?: string,
  nameHash?: string,
}

export interface IconIndexFunzinnu extends JSON {
  timestamp: number,
  dcConsData: IconFunzinnu[],
}

export interface IconIndex extends JSON 
{
  [key: string]: any,
  timestamp: number,
}