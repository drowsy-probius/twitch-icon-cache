export interface ParentMessage {
  command: string;
  args: unknown;
}

export interface ChildMessage {
  result: string;
}
