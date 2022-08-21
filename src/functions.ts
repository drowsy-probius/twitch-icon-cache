import sqlite3, {Database} from "sqlite3";
import { STREAMER_DATA } from "./data";
import { DB_INIT_COMMANDS, DATABASE } from "./constants";

export const timeParser = (timeString: string, miliseconds=true) => {
  const unit = typeof(timeString.at(-1)) === "string" ? timeString.at(-1) : 's';
  const value = Number(timeString.slice(0, -1));
  const multiplier = miliseconds ? 1000 : 1;
  switch(unit)
  {
    case("M"):
      return value * 30 * 24 * 60 * 60 * multiplier;
    case("d"):
      return value * 24 * 60 * 60 * multiplier;
    case("h"):
      return value * 60 * 60 * multiplier;
    case("m"):
      return value * 60 * multiplier;
    case("s"):
      return value * multiplier;
  }
  return multiplier;
}

export const init_db = async () => {
  const db = new sqlite3.Database(DATABASE);
  makeTables(db);
  insertDefaultData(db);
  db.close();
} 

const makeTables = (db: Database) => {
  DB_INIT_COMMANDS.forEach(command => {
    db.run(command);
  });
}

const insertDefaultData = (db: Database) => {
  const stmt = db.prepare("INSERT OR IGNORE INTO streamers VALUES (?, ?)");
  STREAMER_DATA.forEach(streamer => {
    stmt.run(streamer.name, streamer.url);
  });
  stmt.finalize();
}