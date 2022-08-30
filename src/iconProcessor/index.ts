import { IconProcessorFunctionList, IconIndexPrototype } from "../@types/interfaces";
import funzinnu, { indexDownloader as funzinnuIndexDownloader } from "./funzinnu";
import yeokka, { indexDownloader as yeokkaIndexDownloader } from "./yeokka";
import telk5093, { indexDownloader as telk5093IndexDownloader } from "./telk5093";

const urlFetcher: IconProcessorFunctionList = {
  funzinnu,
  yeokka,
  telk5093,
}

export const indexDownloader: {[key: string]: (url: string) => Promise<IconIndexPrototype>} = {
  "funzinnu": funzinnuIndexDownloader,
  "yeokka": yeokkaIndexDownloader,
  "telk5093": telk5093IndexDownloader,
} 

export default urlFetcher;