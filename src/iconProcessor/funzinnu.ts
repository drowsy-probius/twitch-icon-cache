import { IconProcessorFunction, StreamerData } from "../@types/interfaces"
import Logger from "../logger";
const logger = Logger(module.filename);

const handler: IconProcessorFunction = (streamer: StreamerData) => {
  logger.info(`download icon data for ${streamer.name} with ${streamer.url}`);
  
  fetch(
    streamer.url,
    {
      method: "get",

    }
  )
  .then(res => {
    logger.info(res.text);
  })
}

export default handler;