/**
 * `./data.ts`에서 사용되는 서버 관리자가 설정하는
 * 스트리머 데이터 포맷
 */ 
export interface StreamerData {
  name: string,
  url: string,
}

// iconProcessor 메인 함수 타입
export type IconProcessorFunction = (streamer: StreamerData) => void;

// iconProcessor 함수 목록 타입
export interface IconProcessorFunctionList {
  [key: string]: IconProcessorFunction
}

////////////////////////////////////////////////////////////
/**
 * 공통으로 쓰이는 프로토타입들 
 */

/**
 * 아이콘 프로토타입.
 * 필수 공통 요소는 keywords, tags와 이미지 주소임.
 * 근데 이미지 주소를 uri로 하거나 path로 설정하는 사람도 있음.
 * 그래서 마지막으로 [key: string]: any를 추가했음.
 */
export interface IconPrototype {
  name?: string,
  uri?: string, 
  keywords: string[],
  tags: string[],
  [key: string]: any,
}

/**
 * 아이콘 목록 프로토타입.
 * 아이콘 목록과 기타 정보가 있음
 */
export interface IconIndexPrototype {
  icons: IconPrototype[],
  [key: string]: any,
}

////////////////////////////////////////////////////////////
/**
 * 스트리머 특화 타입
 * iconProcessor에 새로 추가할 때 여기에도 추가하는 것이 좋음.
 * 
 * 여기 있는 인터페이스는 url을 통해서 다운받은 정보를 할당할 때 사용됨.
 */

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
/**
 * 이 서버를 통해서 전송되는 데이터의 형식을 나타냄.
 */

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