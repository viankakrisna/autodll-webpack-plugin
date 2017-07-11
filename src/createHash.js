import crypto from 'crypto';
import path from 'path';
import get from 'lodash/get';
import fs from './utils/fs';
import { cacheDir } from './paths';

export const getSources = (watchPaths, sourceMethod) => {
  const getSource = watchPath => {
    try {
      if (fs.lstatSync(watchPath).isDirectory()) {
        if (watchPath.startsWith(cacheDir)) {
          return watchPath;
        }
        const fileList = fs.readdirSync(watchPath);
        return getSources(
          fileList.map(file => path.join(watchPath, file)),
          sourceMethod
        );
      } else {
        return sourceMethod(watchPath);
      }
    } catch (ignored) {
      return watchPath;
    }
  };
  let result = '';
  for (let i = watchPaths.length - 1; i >= 0; i--) {
    result += getSource(watchPaths[i]);
  }
  return result;
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
