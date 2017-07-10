import test from 'tape';
import path from 'path';
import fs from '../src/utils/fs';
import createHash, { getSources, getSourceMethod } from '../src/createHash';
import findCacheDir from 'find-cache-dir';
import makedir from 'make-dir';

const testDirectory = findCacheDir({
  name: 'testing-autodll-webpack-plugin',
});

const settings = {
  id: 1,
  env: 'development',
  watch: [testDirectory],
};

const getRandomString = () => `randomString_${Math.random()}`;

test('createHash should create new hash when files in watch directory is changed', t => {
  var firstHash, secondHash;
  makedir(testDirectory).then(() => {
    fs
      .writeFileAsync(
        path.join(testDirectory, getRandomString()),
        getRandomString()
      )
      .then(() => {
        firstHash = createHash(settings);
        return fs.writeFileAsync(
          path.join(testDirectory, getRandomString()),
          getRandomString()
        );
      })
      .then(() => {
        secondHash = createHash(settings);
        t.notEqual(
          firstHash,
          secondHash,
          `hashes should not be the same: 
          first hash is: ${firstHash} 
          second hash is: ${secondHash}`
        );
        t.end();
      });
  });
});

test('getSources should create new source when files in watch directory is changed', t => {
  makedir(testDirectory).then(() => {
    var firstSource, secondSource;

    fs
      .writeFileAsync(
        path.join(testDirectory, getRandomString()),
        getRandomString()
      )
      .then(() => {
        firstSource = getSources(settings.watch, getSourceMethod('content'));
        return fs.writeFileAsync(
          path.join(testDirectory, getRandomString()),
          getRandomString()
        );
      })
      .then(() => {
        secondSource = getSources(settings.watch, getSourceMethod('content'));
        t.notEqual(
          firstSource,
          secondSource,
          `sources should not be the same: 
          first source is: ${firstSource} 
          second source is: ${secondSource}`
        );
        t.end();
      });
  });
});

test('getSourceMethod should return a function', t => {
  t.equal(typeof getSourceMethod(), 'function');
  t.end();
});
