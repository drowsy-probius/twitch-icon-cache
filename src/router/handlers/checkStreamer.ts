import { Request, Response, NextFunction } from "express";
import { StreamerListModel } from "../../database";

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
const handler = async (req: Request, res: Response, next: NextFunction) => {
  // /:streamer으로 전달된 값.
  const streamer = req.params.streamer;
  const streamerNumber = Number(streamer);
  /**
   * STREAMER_DATA.filter(d => d.name === streamer).length !== 0
   * 으로 판정해도 되지만 아래 방법이 더 효율적이라 생각함.
   */
  
  const count = await StreamerListModel.count(isNaN(streamerNumber) ? {name: streamer} : {id: streamerNumber});
  if(count > 0) return next();
  
  /**
   * parameter로 받은 스트리머가 
   * 서버에 등록된 값이 아닐 경우 404로 응답함.
   * 
   * return으로 명시해야 next()함수를 호출하지 않고
   * 여기서 종료됨.
   */
  return res.status(404).json({
    status: false,
    message: `${streamer} not supported`
  });
}

export default handler;