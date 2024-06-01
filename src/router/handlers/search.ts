import { Router, Request, Response } from 'express';
import { resolve, join } from 'path';
import { readFileSync } from 'fs';

import checkStreamerWrapper from './checkStreamerWrapper';
import { INDEX_FILE } from '../../constants';
import { STREAMER_DATA } from '../../data';
import { getImageBasePath } from '../../functions';
import { IconIndex, Icon } from '../../@types/interfaces';

const router = Router({ mergeParams: true });
const basePath = resolve('.');

const searchAll = (req: Request, res: Response) => {
  const keyword = req.params.keyword;
  const result: { match: Icon | null; candidate: Icon[] } = {
    match: null,
    candidate: [],
  };

  for (const streamerData of STREAMER_DATA) {
    const jsonPath = resolve(
      join(getImageBasePath(streamerData.name.twitch), INDEX_FILE)
    );
    const data = readFileSync(jsonPath, 'utf8');
    const jsonData: IconIndex = JSON.parse(data);
    for (const icon of jsonData.icons) {
      if (result.match === null && icon.keywords.includes(keyword)) {
        result.match = {
          ...icon,
          uri: icon.uri.replace(basePath, '.'),
          thumbnailUri: icon.thumbnailUri.replace(basePath, '.'),
        };
      } else {
        let inserted = false;
        for (const keyw of icon.keywords) {
          if (keyw.includes(keyword)) {
            result.candidate.push({
              ...icon,
              uri: icon.uri.replace(basePath, '.'),
              thumbnailUri: icon.thumbnailUri.replace(basePath, '.'),
            });
            inserted = true;
            break;
          }
        }
        if (inserted) continue;

        for (const tag of icon.tags) {
          if (tag.includes(keyword)) {
            result.candidate.push({
              ...icon,
              uri: icon.uri.replace(basePath, '.'),
              thumbnailUri: icon.thumbnailUri.replace(basePath, '.'),
            });
            inserted = true;
            break;
          }
        }
      }
    }
  }

  return res.status(200).json(result);
};

const searchStreamerOnly = (req: Request, res: Response) => {
  const streamer = req.params.streamer;
  const keyword = req.params.keyword;

  const result: { match: Icon | null; candidate: Icon[] } = {
    match: null,
    candidate: [],
  };
  const jsonPath = resolve(join(getImageBasePath(streamer), INDEX_FILE));
  const data = readFileSync(jsonPath, 'utf8');
  const jsonData: IconIndex = JSON.parse(data);
  for (const icon of jsonData.icons) {
    if (result.match === null && icon.keywords.includes(keyword)) {
      result.match = {
        ...icon,
        uri: icon.uri.replace(basePath, '.'),
        thumbnailUri: icon.thumbnailUri.replace(basePath, '.'),
      };
    } else {
      let inserted = false;
      for (const keyw of icon.keywords) {
        if (keyw.includes(keyword)) {
          result.candidate.push({
            ...icon,
            uri: icon.uri.replace(basePath, '.'),
            thumbnailUri: icon.thumbnailUri.replace(basePath, '.'),
          });
          inserted = true;
          break;
        }
      }
      if (inserted) continue;

      for (const tag of icon.tags) {
        if (tag.includes(keyword)) {
          result.candidate.push({
            ...icon,
            uri: icon.uri.replace(basePath, '.'),
            thumbnailUri: icon.thumbnailUri.replace(basePath, '.'),
          });
          inserted = true;
          break;
        }
      }
    }
  }

  return res.status(200).json(result);
};

router.get('/', (req: Request, res: Response) => {
  return res.status(200).json({
    message: 'Usage: /search/:keyword, /search/:streamer/:keyword',
  });
});
router.get('/:keyword', searchAll);
router.get(
  '/:streamer/:keyword',
  checkStreamerWrapper('twitch'),
  searchStreamerOnly
);

export default router;
