import axios from "axios";
import { createHash } from "crypto";
import { extname } from "path";
import { 
  IconIndexOpenDccon,
  Icon,
  IconIndex,
  IconOpenDccon,
  StreamerData,
} from "../@types/interfaces";
import {
  saveIcon,
  fetchImageAsBuffer,
  isImageInLocal,
} from "./functions";
import retry from "async-retry";
import { Logger } from "winston";


type IconImageCandidates = "uri" | "path" | "url" | "name";
interface resolveIconUrlHint {
  found: boolean,
  domainUrl: string,
  baseUrl: string,
  propsName: IconImageCandidates,
}

class OpenDccon {
  hint: resolveIconUrlHint = {
    found: false,
    domainUrl: "",
    baseUrl: "",
    propsName: "name",
  }
  logger: Logger;


  constructor(logger: Logger) {
    this.logger = logger;
  }

  async downloadIndexFromUrl (url: string): Promise<IconIndexOpenDccon> {
    const indexRes = await retry(() => axios.get(encodeURI(decodeURI(`${url}${url.includes("?") ? "&" : "?"}ts=${Date.now()}`))), {
      retries: 5,
    });
    this.logger.debug(`[downloadIndexFromUrl] download index done!`);
    const jsonData: IconIndexOpenDccon = indexRes.data;
    return jsonData;
  }

  async resolveAbsoluteIconUrl (streamer: StreamerData, icon: IconOpenDccon): Promise<string> {
    if(this.hint.found) 
    {
      const path = icon[this.hint.propsName] as string;
      if(path.startsWith("http://") || path.startsWith("https://")) return path;
      return new URL(icon[this.hint.propsName] as string, this.hint.baseUrl).href;
    }

    /**
     * 이미지 주소가 name이 아니라 uri, path, url로 주어진 경우
     */
    const candidateProps: IconImageCandidates[] = ["uri", "path", "url"];
    for(const prop of candidateProps)
    {
      if(icon[prop] === undefined) continue;
      const propValue = icon[prop];
      if(typeof(propValue) !== "string") continue;

      /**
       * 이미지 주소 자체가 http주소로 주어진 경우 (가장 좋음)
       */
      if(propValue.startsWith("http://") || propValue.startsWith("https://"))
      {
        this.hint.found = true;
        this.hint.propsName = prop;
        this.hint.baseUrl = "";
        return propValue;
      }
      
      /**
       * 이미지 주소의 접두사가 index 주소의 도메인이 아닌 경우
       */
      if(streamer.imagePrefix)
      {
        const path = new URL(propValue, streamer.imagePrefix).href;
        const res = await axios.get(encodeURI(decodeURI(path)), {responseType: "stream"});
        if(res.status === 200)
        {
          this.hint.found = true;
          this.hint.propsName = prop;
          this.hint.baseUrl = streamer.imagePrefix;
          return path;
        }
      }

      /**
       * 이미지 주소의 접두사가 index 주소의 도메인인 경우
       */
      const path = new URL(propValue, this.hint.domainUrl).href;
      const res = await axios.get(encodeURI(decodeURI(path)), {responseType: "stream"});
      if(res.status === 200)
      {
        this.hint.found = true;
        this.hint.propsName = prop;
        this.hint.baseUrl = this.hint.domainUrl;
        return path;
      }
    }

  
    throw new Error(`Cannot find working url for ${streamer.name} - ${icon.tags[0]}`);
  }


  async formatIcon (streamer: StreamerData, icon: IconOpenDccon): Promise<Icon> {
    if(icon.tags.length === 0) icon.tags.push("미지정");
    const originIconUrl = await retry(() => this.resolveAbsoluteIconUrl(streamer, icon), {
      retries: 5,
    });
    const formattedIcon: Icon = {
      name: `${icon.keywords[0]}`,
      hash: '', // evaluated in saveIcon function
      iconHash: '', // evaluated in saveIcon function
      path: ``, // evaluated in router function
      keywords: icon.keywords,
      tags: icon.tags,
      useOrigin: false,
      originPath: originIconUrl
    };
    return formattedIcon;
  }

  async formatIconIndex (streamer: StreamerData, jsonData: IconIndexOpenDccon): Promise<IconIndex> {
    await this.resolveAbsoluteIconUrl(streamer, jsonData.dccons[0]); // resolve hints

    const iconData = await Promise.all(
      jsonData.dccons.map(async (icon: IconOpenDccon): Promise<Icon> => {
        return this.formatIcon(streamer, icon)
        .then(async (icon: Icon) => {
          const imageBuffer = await retry(() => fetchImageAsBuffer(icon.originPath, this.logger), {
            retries: 5,
          });
          icon.iconHash = createHash('sha256').update(imageBuffer).digest('hex');
          icon.hash = createHash("sha256").update(`${icon.keywords[0]}`).digest('hex');

          // already same object in database (local)
          if(await isImageInLocal(icon.iconHash))
          {
            this.logger.info(`[isImageInLocal] image is in local database`);
            return icon;
          }

          return retry(() => saveIcon(imageBuffer, icon, this.logger), {
            retries: 5,
          });
        })
      })
    );
    
    const formattedIconIndex: IconIndex = {
      icons: iconData,
      timestamp: Date.now(),
    }
    return formattedIconIndex;
  }
}


export default OpenDccon