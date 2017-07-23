import path from 'path';
import isEmpty from 'lodash/isEmpty';
import fs from './utils/fs';
import makeDir from 'make-dir';
import { cacheDir } from './paths';
import createLogger from './createLogger';
import del from 'del';

const isCacheValid = settings => {
  return makeDir(cacheDir)
    .then(() => fs.statAsync(path.resolve(cacheDir, settings.hash)))
    .then(() => true)
    .catch(() => false);
};

const cleanup = settings => () => {
  return fs
    .readdirAsync(cacheDir)
    .filter(dirname => dirname.startsWith(`${settings.env}_${settings.id}`))
    .each(dirname => del(path.join(cacheDir, dirname)));
};

export const runCompile = (settings, getDllCompiler) => () => {
  // skip compiling if there is nothing to build
  // if (isEmpty(settings.entry)) return;
  return new Promise((resolve, reject) => {
    getDllCompiler().run((err, stats) => {
      if (err) {
        return reject(err);
      }
      resolve(stats);
    });
  });
};

const compileIfNeeded = (settings, getCompiler) => {
  const log = createLogger(settings.debug);

  return isCacheValid(settings)
    .then(log.tap(isValid => `is valid cache? ${isValid}`))
    .then(isValid => {
      if (isValid) {
        return { source: 'cache', stats: null };
      }

      return Promise.resolve()
        .then(log.tap('cleanup'))
        .then(cleanup(settings))
        .then(log.tap('compile'))
        .then(runCompile(settings, getCompiler))
        .then((stats) => {
          return { source: 'build', stats };
        });
    });
};

export default compileIfNeeded;
