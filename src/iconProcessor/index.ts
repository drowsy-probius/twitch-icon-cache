import { IconProcessorFunctionList, IconIndexPrototype } from "../@types/interfaces";
import funzinnu, { indexDownloader as funzinnuIndexDownloader } from "./funzinnu";
import yeokka, { indexDownloader as yeokkaIndexDownloader } from "./yeokka";

const urlFetcher: IconProcessorFunctionList = {
  funzinnu,
  yeokka,
}

export const indexDownloader: {[key: string]: (url: string) => Promise<IconIndexPrototype>} = {
  "funzinnu": funzinnuIndexDownloader,
  "yeokka": yeokkaIndexDownloader,
} 

export default urlFetcher;