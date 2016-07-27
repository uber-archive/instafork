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

// Automatically track and cleanup files at exit
temp.track();

import PackageTar from '../helpers/package-tar';

// constants used in tests
const expressModuleName = 'express@1.0.0';
const expressTarFilename = 'express-1.0.0.tgz';
const fixturesPath = path.join(__dirname, 'fixtures');
const originDir = process.cwd();

const getSourceFilePath = (fileName: string) => path.join(fixturesPath, fileName);

test('fetchFromRegistry', function t(assert) {
  const packageTar: PackageTar = new PackageTar(expressModuleName);
  temp.mkdir('fetchFromRegistry', function mkTemp(err, dirPath) {
    if (err) {
      throw err;
    }
    process.chdir(dirPath);
    packageTar.fetchFromRegistry((f) => {
      const fullPath = path.join(process.cwd(), expressTarFilename);
      assert.true(fs.existsSync(fullPath));
      assert.is(packageTar.tarFileName, fullPath);
      process.chdir(originDir);
      assert.end();
    });
  });
});

test('untar', function t(assert) {
  const packageTar: PackageTar = new PackageTar(expressModuleName);
  packageTar.tarFileName = expressTarFilename;
  temp.mkdir('untar', function mkTemp(err, dirPath) {
    if (err) {
      throw err;
    }
    const tarContents = fs.readFileSync(getSourceFilePath(expressTarFilename));
    process.chdir(dirPath);
    fs.writeFileSync(expressTarFilename, tarContents);

    packageTar.untar(() => {
      assert.true(fs.existsSync(path.join(process.cwd(), 'instafork-temp', 'express')));
      process.chdir(originDir);
      assert.end();
    });
  });
});
