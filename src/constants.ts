export const PORT: number = Number(process.env.TWITCH_ICON_CACHE_PORT) || 32189;

export const HOST: string = process.env.TWITCH_ICON_CACHE_HOST || "0.0.0.0";

export const DATABASE: string = process.env.TWITCH_ICON_CACHE_DB || "./database/db.sqlite3";

export const CACHE_TIME: string = process.env.TWITCH_ICON_CACHE_CACHE_TIME || "30d";

/////////////////////////////////////

export const DB_INIT_COMMANDS = [
  `
  CREATE TABLE IF NOT EXISTS 
  streamers (
    name TEXT,
    url TEXT,
    UNIQUE(name)
  );
  `,

  `
  CREATE TABLE IF NOT EXISTS
  icon_data (
    name TEXT,
    uri TEXT,
    keywords TEXT,
    tags TEXT,
    owner TEXT
  );
  `,
]