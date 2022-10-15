import { Request, Response, NextFunction } from "express";
import { StreamerListModel } from "../../database";
import Logger from "../../logger";

/**
 * paramer로 요청한 스트리머가 이 서버에 등록된 스트리머인지 확인하는
 * 미들웨어
 *
 * 없다면 404를 리턴함.
 * @param req
 * @param res
 * @param next
 * @returns
 */
export const checkStreamerHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // /:streamer으로 전달된 값.
  const logger = Logger(`${module.filename}:checkStramerHandler`);
  const streamer = req.params.streamer;
  const streamerNumber = Number(streamer);
  /**
   * STREAMER_DATA.filter(d => d.name === streamer).length !== 0
   * 으로 판정해도 되지만 아래 방법이 더 효율적이라 생각함.
   */

  const streamerDoc = await StreamerListModel.findOne(
    isNaN(streamerNumber) ? { name: streamer } : { id: streamerNumber }
  );
  if (streamerDoc === null) {
    /**
     * parameter로 받은 스트리머가
     * 서버에 등록된 값이 아닐 경우 404로 응답함.
     *
     * return으로 명시해야 next()함수를 호출하지 않고
     * 여기서 종료됨.
     */
    logger.warn(`Unlisted streamer ${streamer}`);
    // return res.status(404).json({
    //   status: false,
    //   message: `Unsupported streamer ${streamer}`,
    // });
    return res.status(200).json([]);
  }

  res.locals.streamerDoc = streamerDoc;
  next();
};

export const isStringArray = (obj: any) => {
  return Array.isArray(obj) && obj.every((i) => typeof i === "string");
};

export const successResponder = (res: Response, message: any = "", statusCode=200) => {
  return res.status(statusCode).json({
    error: null,
    message: message,
  });
}

export const failResponder = (res: Response, error: any, message: any = "", statusCode=400) => {
  return res.status(statusCode).json({
    error: error,
    message: message,
  });
}