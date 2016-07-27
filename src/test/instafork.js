// @flow

// Copyright (c) 2017 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import test from 'tape';
import path from 'path';
import fs from 'fs-extra';
import temp from 'temp';
import jsonfile from 'jsonfile';

// Automatically track and cleanup files at exit
temp.track();

import instafork from '../instafork';

// constants used in tests
const originDir = process.cwd();
const fixturesPath = path.join(__dirname, 'fixtures');

test('end-to-end: Copy module from node_modules', function t(assert) {
  temp.mkdir('copy-from-node_modules', function mkTemp(err, dirPath) {
    if (err) {
      throw err;
    }

    const sourceFixturePath = path.join(fixturesPath, 'instafork-copy-from-node_modules');
    const destinationFixturePath = path.join(dirPath, 'instafork-copy-from-node_modules');
    fs.copySync(sourceFixturePath, destinationFixturePath);
    process.chdir(destinationFixturePath);
    const cwd = process.cwd();

    instafork('just-omit', {}, null, (instaforkErr) => {
      assert.notOk(instaforkErr, 'Callback is called with no error.');
      assert.true(fs.existsSync(path.join(cwd, 'package.json')), 'should not remove package.json');
      assert.true(fs.existsSync(path.join(cwd, 'just-omit')), 'should inject meow directory');
      const indexContents = fs.readFileSync(path.join(cwd, 'index.js'), 'utf8');
      assert.true((/just-omit\/index.js/).test(indexContents), 'should rewrite require statement');
      process.chdir(originDir);

      assert.end();
    });
  });
});

test('end-to-end: Copy module from remote', function t(assert) {
  temp.mkdir('copy-from-remote', function mkTemp(err, dirPath) {
    if (err) {
      throw err;
    }

    const sourceFixturePath = path.join(fixturesPath, 'instafork-copy-from-remote');
    const destinationFixturePath = path.join(dirPath, 'instafork-copy-from-remote');
    fs.copySync(sourceFixturePath, destinationFixturePath);
    process.chdir(destinationFixturePath);
    const cwd = process.cwd();

    instafork('meow', {}, null, (instaforkErr) => {
      assert.notOk(instaforkErr, 'Callback is called with no error.');
      assert.true(fs.existsSync(path.join(cwd, 'package.json')), 'should not remove package.json');
      assert.true(fs.existsSync(path.join(cwd, 'meow')), 'should inject meow directory');
      const indexContents = fs.readFileSync(path.join(cwd, 'index.js'), 'utf8');
      assert.true((/meow\/index.js/).test(indexContents), 'should rewrite require statement');

      const packageContent = jsonfile.readFileSync('package.json');
      const deps = packageContent.dependencies;
      assert.true(deps.minimist, 'original project should now depend on minimist');
      assert.false(deps.express, 'original project should not depend on express');

      process.chdir(originDir);

      assert.end();
    });
  });
});
