'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getHash = exports.compile = exports.HASH_FILENAME = undefined;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _isEmpty = require('lodash/isEmpty');

var _isEmpty2 = _interopRequireDefault(_isEmpty);

var _fs = require('./utils/fs');

var _fs2 = _interopRequireDefault(_fs);

var _index = require('./utils/index.js');

var _paths = require('./paths');

var _createLogger = require('./createLogger');

var _createLogger2 = _interopRequireDefault(_createLogger);

var _del = require('del');

var _del2 = _interopRequireDefault(_del);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const HASH_FILENAME = exports.HASH_FILENAME = 'lastHash';

const isCacheValid = newHash => {
  return (0, _index.mkdirp)(_paths.cacheDir).then(() => _fs2.default.readFileAsync(_path2.default.resolve(_paths.cacheDir, HASH_FILENAME), 'utf-8')).then(lastHash => {
    return lastHash === newHash;
  }).catch(() => {
    return false;
  });
};

const cleanup = () => (0, _del2.default)(_path2.default.join(_paths.cacheDir, '**/*'));

const storeHash = hash => () => {
  return _fs2.default.writeFileAsync(_path2.default.resolve(_paths.cacheDir, HASH_FILENAME), hash);
};

const compile = exports.compile = (settings, getCompiler) => () => {
  // skip compiling if there is nothing to build
  if ((0, _isEmpty2.default)(settings.entry)) return;

  return new _bluebird2.default((resolve, reject) => {
    getCompiler().run((err, stats) => {
      if (err) {
        return reject(err);
      }
      resolve(stats);
    });
  });
};

const getContents = watchPath => _fs2.default.statAsync(watchPath).then(stats => stats.isDirectory() ? watchPath.startsWith(_paths.cacheDir) ? '' : _fs2.default.readdirAsync(watchPath).then(files => _bluebird2.default.mapSeries(files, p => getContents(_path2.default.join(watchPath, p)))).then(res => res.join('')) : _fs2.default.readFileAsync(watchPath, 'utf-8')).catch(err => {
  console.error(err ? err.message : err);
  return '';
});

const getHash = exports.getHash = settings => {
  const hash = _crypto2.default.createHash('md5');
  const settingsJSON = JSON.stringify(settings);

  hash.update(settingsJSON);

  if (Array.isArray(settings.watch)) {
    return _bluebird2.default.all(settings.watch.map(getContents)).then(res => hash.update(res.join(''))).then(() => hash.digest('hex'));
  }
  return _bluebird2.default.resolve(hash.digest('hex'));
};

const compileIfNeeded = (settings, getCompiler) => {
  const log = (0, _createLogger2.default)(settings.debug);
  return getHash(settings).then(currentHash => isCacheValid(currentHash).then(log.tap(isValid => `is valid cache? ${isValid}`)).then(isValid => {
    if (isValid) return;

    return _bluebird2.default.resolve().then(log.tap('cleanup')).then(cleanup).then(log.tap('compile')).then(compile(settings, getCompiler)).then(storeHash(currentHash));
  }));
};

exports.default = compileIfNeeded;