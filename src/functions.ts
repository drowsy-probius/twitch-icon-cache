import { Executable, AnyFunction } from "./@types/interfaces";

export const timeParser = (timeString: string, miliseconds=true) => {
  const unit = typeof(timeString.slice(-1)) === "string" ? timeString.slice(-1) : 's';
  const value = Number(timeString.slice(0, -1));
  const multiplier = miliseconds ? 1000 : 1;
  switch(unit)
  {
    case("M"):
      return value * 30 * 24 * 60 * 60 * multiplier;
    case("w"):
      return value * 7 * 24 * 60 * 60 * multiplier;
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

export const sleep = (time: number) => {
  return new Promise(resolve => setTimeout(resolve, time));
}

export const tryMax = async (execute: Executable, tries=1, max=3, errorLogger: AnyFunction | undefined): Promise<unknown> => {
  try 
  {
    return await execute();
  }
  catch(err)
  {
    if(tries > max) throw err;
    if(errorLogger !== undefined) errorLogger(err);
    return tryMax(execute, tries+1, max, errorLogger);
  }
}
