import test from 'tape';
import fs from 'fs';
import { execSync } from 'child_process';
import pkg from '../examples/watch/package';
import path from 'path';
import del from 'del';

const watchExamplesDirectory = path.resolve(path.join('examples', 'watch'));
const watchExamplesNodeModulesDirectory = path.resolve(
  path.join(watchExamplesDirectory, 'node_modules')
);

const cacheDirectory = path.resolve(
  path.join(
    watchExamplesNodeModulesDirectory,
    '.cache',
    'autodll-webpack-plugin'
  )
);

const install = () =>
  fs.existsSync(watchExamplesNodeModulesDirectory)
    ? null
    : execSync('npm install');

const build = () => execSync(pkg.scripts.build);

test('It should invalidate the cache when files in node_modules is changed', t => {
  del(cacheDirectory).then(() => {
    process.chdir(watchExamplesDirectory);
    install();
    build();
    const firstCacheFiles = fs.readdirSync(cacheDirectory);
    const invalidate = `invalidate${Math.random()}`;
    fs.writeFileSync(
      path.join(watchExamplesNodeModulesDirectory, invalidate),
      invalidate
    );
    build();
    const secondCacheFiles = fs.readdirSync(cacheDirectory);
    t.notDeepEqual(
      firstCacheFiles,
      secondCacheFiles,
      `should not be the same, ${firstCacheFiles}, ${secondCacheFiles}`
    );
    t.end();
  });
});
