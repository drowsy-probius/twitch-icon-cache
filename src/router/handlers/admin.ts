import { Router, Request, Response, NextFunction } from "express";

import Logger from "../../logger";

const router = Router({mergeParams: true});

/**
 * 관리자 페이지에서 할 수 있는 일
 * 
 * 아이콘 새로 추가 요청이 발생하면 검토 후 허가 또는 삭제 처리
 * 악성 사용자 차단 -> 이상한 아이콘을 n회 이상 업로드 한 경우
 * 데이터베이스를 볼 수 있으면 편할 듯
 * 
 * twitch oauth로 로그인 할 때 사용자 아이디와 데이터베이스에 저장된 관리자 값과 비교해서
 * 관리자 권한인지 확인함.
 * 
 * 검토 로직을 이미지 업로드 요청이 왔을 때 
 * 서버에서 디스코드나 텔레그램으로 알림을 주고 버튼을 눌러서 처리하도록 하면 
 * 검토 로직은 훨씬 편해지고 임시 이미지 데이터가 서버에 쌓여있을 일도 없을 듯.
 * 다만 개발 비용은 조금...
 * 
 * 
 * resolve, reject 수행할 때 로컬에 저장되었던
 * 임시 이미지 삭제해야함.
 * 
 */

const adminCheckHandler = async (req: Request, res: Response, next: NextFunction) => {
  // TODO
  console.log("admin");
  next();
}

const iconResolveHandler = async (req: Request, res: Response) => {
  const objectId = req.params.objectId;
}

const iconRejectHandler = async (req: Request, res: Response) => {
  const objectId = req.params.objectId;
}

const iconReportHandler = async (req: Request, res: Response) => {
  const objectId = req.params.objectId;
}

const banStreamerHandler = async (req: Request, res: Response) => {
  const streamerName = req.params.streamerName;
}

router.get('/',);

router.get('/icon/:objectId/resolve', iconResolveHandler);
router.get('/icon/:objectId/reject', iconRejectHandler);
router.get('/icon/:objectId/report', iconReportHandler);

router.get('/ban/:streamerName', banStreamerHandler);

export default router.use(adminCheckHandler);