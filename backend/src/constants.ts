import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

export const IS_PRODUCTION: boolean = ["true", "True", "TRUE"].includes(process.env.ICONTTV_BACKEND_PRODUCTION || "");

export const LOG_LEVEL: string = process.env.ICONTTV_BACKEND_LOG_LEVEL ?? "debug";

// 서버가 동작할 포트호스트
export const PORT: number = Number(process.env.ICONTTV_BACKEND_PORT) ?? 32189;

// 서버가 동작할 호스트
export const HOST: string = process.env.ICONTTV_BACKEND_HOST ?? "localhost";

//
export const DOMAIN: string = process.env.ICONTTV_BACKEND_DOMAIN || ".";

// 이 시간이 지나면 자동으로 백그라운드 작업을 수행함
export const REFRESH_INTERVAL: string =
  process.env.ICONTTV_BACKEND_REFRESH_INTERVAL || "2w";

// `/refresh/:streamer?key=` api에 접속할 때 사용할 키 값. 외부 유출에 유의
export const REFRESH_KEY: string =
  process.env.ICONTTV_BACKEND_REFRESH_KEY ?? "secretkey";

// database host and port
export const DB_HOST: string = process.env.ICONTTV_BACKEND_DB_HOST || "localhost";
export const DB_PORT: number = Number(process.env.ICONTTV_BACKEND_DB_PORT) || 27017;
export const DB_NAME: string = process.env.ICONTTV_BACKEND_DB_NAME || "iconttv";

// database user and pass
export const DB_USER: string = process.env.ICONTTV_BACKEND_DB_USER || "";
export const DB_PASS: string = process.env.ICONTTV_BACKEND_DB_PASS || "";

// 이미지 파일 확장자 `.`이 포함됨.
export const IMAGE: string[] = [".jpg", ".png", ".gif", ".jpeg", ".webp"];

// 최대 재시작 값
export const MAX_RETRY = 5;

// 이미지 데이터를 저장하는 json 파일 이름.
export const INDEX_FILE = "index.json";

// 다운로드 및 처리에 실패한 이미지 데이터를 저장하는 json 파일 이름
export const FAILED_LIST_FILE = "fail.json";

/////////////////////////////////////
