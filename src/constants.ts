// 서버가 동작할 포트
export const PORT: number = Number(process.env.TWITCH_ICON_CACHE_PORT) || 32189;

// 서버가 동작할 호스트
export const HOST: string = process.env.TWITCH_ICON_CACHE_HOST || "0.0.0.0";

// 이 시간이 지나면 자동으로 백그라운드 작업을 수행함
export const CACHE_TIME: string = process.env.TWITCH_ICON_CACHE_CACHE_TIME || "2w";

// `/refresh/:streamer?key=` api에 접속할 때 사용할 키 값. 외부 유출에 유의
export const REFRESH_KEY: string = process.env.TWITCH_ICON_REFRESH_KEY || "secretkey";

// 이미지 파일 확장자 `.`이 포함됨.
export const IMAGE: string[] = [".jpg", ".png", ".gif", ".jpeg", ".webp"];

// 최대 재시작 값
export const MAX_RETRY = 5;

// 이미지 데이터를 저장하는 json 파일 이름.
export const INDEX_FILE = "index.json";

// 다운로드 및 처리에 실패한 이미지 데이터를 저장하는 json 파일 이릉ㅁ
export const FAILED_LIST_FILE = "fail.json";

// `/icon` api에서 제공하는 아이콘 이미지 크기 목록
export const ICON_SIZE: number[] = [16, 32, 48, 128];

/////////////////////////////////////
