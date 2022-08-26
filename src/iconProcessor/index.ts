import { IconProcessorFunctionList, IconIndexPrototype } from "../@types/interfaces";
import funzinnu, { indexDownloader as funzinnuIndexDownloader } from "./funzinnu";

const urlFetcher: IconProcessorFunctionList = {
  funzinnu,
}

export const indexDownloader: {[key: string]: (url: string) => Promise<IconIndexPrototype>} = {
  "funzinnu": funzinnuIndexDownloader,
} 

export default urlFetcher;