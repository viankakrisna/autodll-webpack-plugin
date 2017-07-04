import path from 'path';
import crypto from 'crypto';
import isEmpty from 'lodash/isEmpty';
import fs from './utils/fs';
import { mkdirp } from './utils/index.js';
import { cacheDir } from './paths';
import createLogger from './createLogger';
import del from 'del';
import Promise from 'bluebird';

export const HASH_FILENAME = 'lastHash';

const isCacheValid = newHash => {
  return mkdirp(cacheDir)
    .then(() =>
      fs.readFileAsync(path.resolve(cacheDir, HASH_FILENAME), 'utf-8')
    )
    .then(lastHash => {
      return lastHash === newHash;
    })
    .catch(() => {
      return false;
    });
};

const cleanup = () => del(path.join(cacheDir, '**/*'));

const storeHash = hash => () => {
  return fs.writeFileAsync(path.resolve(cacheDir, HASH_FILENAME), hash);
};

export const compile = (settings, getCompiler) => () => {
  // skip compiling if there is nothing to build
  if (isEmpty(settings.entry)) return;

  return new Promise((resolve, reject) => {
    getCompiler().run((err, stats) => {
      if (err) {
        return reject(err);
      }
      resolve(stats);
    });
  });
};

const getContents = watchPath =>
  fs
    .statAsync(watchPath)
    .then(
      stats =>
        stats.isDirectory()
          ? watchPath.startsWith(cacheDir)
            ? ''
            : fs
                .readdirAsync(watchPath)
                .then(files =>
                  Promise.mapSeries(files, p =>
                    getContents(path.join(watchPath, p))
                  )
                ).then(res => res.join(''))
          : fs.readFileAsync(watchPath, 'utf-8')
    )
    .catch(err => {
      console.error(err ? err.message : err);
      return '';
    });

export const getHash = settings => {
  const hash = crypto.createHash('md5');
  const settingsJSON = JSON.stringify(settings);

  hash.update(settingsJSON);

  if (Array.isArray(settings.watch)) {
    return Promise.all(settings.watch.map(getContents))
      .then(res => hash.update(res.join('')))
      .then(() => hash.digest('hex'));
  }
  return Promise.resolve(hash.digest('hex'));
};

const compileIfNeeded = (settings, getCompiler) => {
  const log = createLogger(settings.debug);
  return getHash(settings).then(currentHash =>
    isCacheValid(currentHash)
      .then(log.tap(isValid => `is valid cache? ${isValid}`))
      .then(isValid => {
        if (isValid) return;

        return Promise.resolve()
          .then(log.tap('cleanup'))
          .then(cleanup)
          .then(log.tap('compile'))
          .then(compile(settings, getCompiler))
          .then(storeHash(currentHash));
      })
  );
};

export default compileIfNeeded;
