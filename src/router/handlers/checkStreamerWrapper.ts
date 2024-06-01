import { Request, Response, NextFunction } from 'express';
import { STREAMER_DATA } from '../../data';
import { StreamPlatform, StreamerData } from '../../@types/interfaces';

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
const handlerWrapper = (streamPlatform: StreamPlatform | null) => {
  const isValidStreamerName = (
    streamerData: StreamerData[],
    streamerName: string
  ) => {
    if (typeof streamerName !== 'string') {
      return false;
    }

    if (streamPlatform === null) {
      return streamerData.some(sd =>
        Object.values(sd.name).includes(streamerName)
      );
    }
    if (streamPlatform === 'twitch') {
      return streamerData.some(sd => sd.name.twitch === streamerName);
    }
    if (streamPlatform === 'chzzk') {
      return streamerData.some(sd => sd.name.chzzk === streamerName);
    }
    if (streamPlatform === 'youtube') {
      return streamerData.some(sd => sd.name.youtube === streamerName);
    }
    return false;
  };

  return (req: Request, res: Response, next: NextFunction) => {
    // /:streamer으로 전달된 값.
    const streamer = req.params.streamer;

    /**
     * parameter로 받은 스트리머가
     * 서버에 등록된 값이 아닐 경우 404로 응답함.
     *
     * return으로 명시해야 next()함수를 호출하지 않고
     * 여기서 종료됨.
     */
    if (!isValidStreamerName(STREAMER_DATA, streamer)) {
      return res.status(404).json({
        status: false,
        message: `${streamer} not supported`,
      });
    }

    // 스트리머가 있다면 다음 핸들러를 호출함.
    next();
  };
};

export default handlerWrapper;
