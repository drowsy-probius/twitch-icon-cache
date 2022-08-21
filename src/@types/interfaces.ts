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
  use_origin?: boolean,
  origin_uri?: string,
}

export interface IconIndexFunzinnu extends JSON {
  timestamp: number,
  dcConsData: IconFunzinnu[],
}