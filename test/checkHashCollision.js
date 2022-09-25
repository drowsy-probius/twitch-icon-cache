const axios = require("axios");
const crypto = require("crypto");
const path = require("path");

const listUrl = "";
const prefix = "";

(async () => {
  const hashFromBuffer = async (url) => {
    const res = await axios.get(encodeURI(decodeURI(url)), {
      responseType: "arraybuffer"
    });
    const buffer = Buffer.from(res.data, "base64");
    const hash = crypto.createHash("sha256").update(buffer).digest("hex");
    return hash;
  }


  const iconsRes = await axios.get(listUrl, {
    responseType: "application/json",
  });
  const icons = await (await iconsRes.data).icons.map(icon => {
    icon.uri = new URL(icon.uri, prefix).href;
    return icon
  });

  const hashIcons = await Promise.all(icons.map(async icon => {
    icon.hash = await hashFromBuffer(icon.uri);
    return icon;
  }));

  const table = {};
  const collisions = {};
  for(const icon of hashIcons)
  {
    if(!table[icon.hash]) table[icon.hash] = [];
    table[icon.hash].push(icon);
  }

  for(const hash of Object.keys(table))
  {
    if(table[hash].length > 1) 
    {
      collisions[hash] = table[hash];
    }
  }

  console.log(JSON.stringify(collisions, null, 2));
})();