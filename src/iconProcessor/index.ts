import { IconProcessorFunctionList, IconIndexPrototype } from "../@types/interfaces";
import funzinnu, { indexDownloader as funzinnuIndexDownloader } from "./funzinnu";
import yeokka, { indexDownloader as yeokkaIndexDownloader } from "./yeokka";
import telk5093, { indexDownloader as telk5093IndexDownloader } from "./telk5093";

/**
 * index.json을 다운로드 및 생성.
 * 이미지 다운로드 및 resize.
 * fail.json 생성.
 */
const urlFetcher: IconProcessorFunctionList = {
  funzinnu,
  yeokka,
  telk5093,
}

/**
 * index.json파일만 다운로드 함.
 * 새 데이터 확인을 위해서 따로 export했음.
 */
export const indexDownloader: {[key: string]: (url: string) => Promise<IconIndexPrototype>} = {
  "funzinnu": funzinnuIndexDownloader,
  "yeokka": yeokkaIndexDownloader,
  "telk5093": telk5093IndexDownloader,
} 

export default urlFetcher;