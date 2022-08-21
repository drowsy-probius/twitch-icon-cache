export const PORT: number = Number(process.env.TWITCH_ICON_CACHE_PORT) || 32189;

export const HOST: string = process.env.TWITCH_ICON_CACHE_HOST || "0.0.0.0";

export const CACHE_TIME: string = process.env.TWITCH_ICON_CACHE_CACHE_TIME || "30d";

export const IMAGE: string[] = ["jpg", "png", "gif", "jpeg"];

/////////////////////////////////////
