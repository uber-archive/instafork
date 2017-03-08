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
import sinon from 'sinon';
// Automatically track and cleanup files at exit
temp.track();

import helpers from '../helpers/helpers';

// constants used in tests
const expressTarFilename = 'express-1.0.0.tgz';
const fixturesPath = path.join(__dirname, 'fixtures');
const originDir = process.cwd();

const getSourceFilePath = (fileName: string) => path.join(fixturesPath, fileName);
const getTestPackageJsonPath = (fileName: string) => {
  return path.join(fixturesPath, 'test-package-json', fileName);
};

test('sanitizeModuleName', function t(assert) {
  assert.true(helpers.sanitizeModuleName('a-b'), 'a-b');
  assert.true(helpers.sanitizeModuleName('@uber/a-b'), 'uber-a-b');
  assert.true(helpers.sanitizeModuleName('@uber/a-b@1.0.0'), 'uber-a-b-1.0.0');
  assert.end();
});

test('getTarFilePath', function t(assert) {
  // plain package name
  const expressTarPath = getSourceFilePath(expressTarFilename);
  assert.is(helpers.getTarFilePath('express', fixturesPath), expressTarPath);

  // package name with version
  assert.is(helpers.getTarFilePath('express@1.0.0', fixturesPath),
  expressTarPath);

  // namespaced package
  const anchorTarPath = getSourceFilePath('uber-react-anchor-5.3.1.tgz');
  assert.is(helpers.getTarFilePath('@uber/react-anchor', fixturesPath),
  anchorTarPath);

  // namespaced package with version
  assert.is(helpers.getTarFilePath('@uber/react-anchor@5.3.1', fixturesPath),
  anchorTarPath);

  assert.end();
});

test('installDeps: with conflicting dependencies', function t(assert) {
  const packageContent = jsonfile.readFileSync(getTestPackageJsonPath('test-dep-conflict.json'));
  process.chdir(path.join(__dirname, 'fixtures'));
  const stub = sinon.stub(helpers, 'installModule', (module, version, cb) => {
    return cb();
  });
  helpers.installDeps(packageContent, (err) => {
    assert.equal(err && err.message,
      'Installed eslint@2.13.1 version conflicts with the required version ^3.12.0.',
      'Returns an error when there is any dep conflict.');
    stub.restore();
    assert.end();
  });
});

test('installDeps: with no conflicting dependencies', function t(assert) {
  assert.plan(5);
  const packageContent = jsonfile.readFileSync(
    getTestPackageJsonPath('test-no-dep-conflict.json'));
  process.chdir(path.join(__dirname, 'fixtures'));
  const stub = sinon.stub(helpers, 'installModule', (module, version, cb) => {
    return cb();
  });

  helpers.installDeps(packageContent, (err) => {
    assert.notOk(err, 'Callback is called with no error.');
    assert.equal(stub.callCount, 2, 'two dependencies were installed');
    assert.notOk(stub.calledWith('eslint'),
      'eslint is not installed as it is already an existing dep');
    assert.ok(stub.calledWith('just-pick', '^1.0.3'), 'just-pick@^1.0.3 is installed');
    assert.ok(stub.calledWith('just-pluck-it', '^1.1.21'), 'just-pluck-it@^1.1.21 is installed');
    stub.restore();
    assert.end();
  });
});

test('installDeps: module with no dependencies', function t(assert) {
  const packageContent = jsonfile.readFileSync(getTestPackageJsonPath('test-no-module-deps.json'));
  process.chdir(path.join(__dirname, 'fixtures'));
  const stub = sinon.stub(helpers, 'installModule', (module, version, cb) => cb());
  helpers.installDeps(packageContent, (err) => {
    assert.notOk(err, 'Callback is called with no error.');
    assert.equal(stub.callCount, 0, 'no dependencies to install');
    stub.restore();
    process.chdir(originDir);
    assert.end();
  });
});

test('existsInNodeModules', function t(assert) {
  assert.plan(2);
  process.chdir(fixturesPath);

  assert.false(helpers.existsInNodeModules('express'),
    'express should not exist in node_modules');
  assert.true(helpers.existsInNodeModules('just-omit'),
    'just-omit should exist in node_modules');
  process.chdir(originDir);
  assert.end();
});

// TODO: test function outside of current dir
// TODO: dynamically determine root of module (currently module resolution file is two levels deep)
test('getPathToModule', function t(assert) {
  const pathToModule = helpers.getPathToModule('meow');
  const root = path.resolve(__dirname, '..', '..');
  assert.true(fs.lstatSync(pathToModule).isDirectory());
  assert.is(pathToModule, path.join(root, 'node_modules', 'meow'));
  assert.end();
});

test('replaceModuleRequires flat', function t(assert) {
  temp.mkdir('replaceModuleRequires', function mkTemp(err, dirPath) {
    if (err) {
      throw err;
    }
    const tempFixturePath = path.join(dirPath, 'replace-module-requires');

    fs.copySync(path.join(fixturesPath, 'replace-module-requires'), tempFixturePath);
    process.chdir(tempFixturePath);

    const newExpressPath = path.join(process.cwd(), 'express', 'index.js');
    helpers.replaceModuleRequires('express', newExpressPath, () => {
      const inputFileContent = fs.readFileSync(path.join(tempFixturePath, 'input.js'), 'utf8');
      const outputFileContent = fs.readFileSync(path.join(tempFixturePath, 'output.js'), 'utf8');
      assert.is(inputFileContent, outputFileContent, 'flat input should equal input');

      const nestedInputPath = path.join(tempFixturePath, 'nested', 'input.js');
      const nestedInputFileContent = fs.readFileSync(nestedInputPath, 'utf8');

      const nestedOutputPath = path.join(tempFixturePath, 'nested', 'output.js');
      const nestedOutputFileContent = fs.readFileSync(nestedOutputPath, 'utf8');
      assert.is(nestedInputFileContent, nestedOutputFileContent,
        'nested input should equal nested output');

      process.chdir(originDir);
      assert.end();
    });
  });
});
