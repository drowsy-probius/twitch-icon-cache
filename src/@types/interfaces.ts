export interface StreamerData {
  name: string,
  url: string,
}

export type IconProcessorFunction = (streamer: StreamerData) => void;

export interface IconProcessorFunctionList {
  [key: string]: IconProcessorFunction
}