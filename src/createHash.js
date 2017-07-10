import crypto from 'crypto';
import path from 'path';
import get from 'lodash/get';
import fs from './utils/fs';
import { cacheDir } from './paths';

export const getSources = (watchPaths, sourceMethod) => {
  const getSource = watchPath => {
    try {
      if (fs.existsSync(watchPath)) {
        if (fs.lstatSync(watchPath).isDirectory()) {
          if (watchPath.startsWith(cacheDir)) {
            return '';
          }
          return fs
            .readdirSync(watchPath)
            .map(p => getSource(path.join(watchPath, p)))
            .join('');
        } else {
          return sourceMethod(watchPath);
        }
      }
    } catch (ignored) {
      // Just fallback to empty string below
    }
    return '';
  };
  return watchPaths.map(getSource).join('');
};

export const getSourceMethod = key => {
  switch (key) {
  case 'content':
    return filePath => fs.readFileSync(filePath, 'utf-8');
  case 'mtime':
  default:
    return filePath => `${filePath}_${fs.statSync(filePath).mtime}`;
  }
};

const createHash = settings => {
  const hash = crypto.createHash('md5');
  const watchPaths = get(settings, 'watch.paths', settings.watch);
  const settingsJSON = JSON.stringify(settings);

  hash.update(settingsJSON);

  if (Array.isArray(watchPaths)) {
    const sourceMethodKey = get(settings, 'watch.sourceMethod', 'mtime');
    hash.update(getSources(watchPaths, getSourceMethod(sourceMethodKey)));
  }

  return `${settings.env}_${settings.id}_${hash.digest('hex')}`;
};

export default createHash;
