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

import {exec} from 'child_process';
import {extract} from 'tar-fs';
import fs from 'fs';
import globby from 'globby';
import path from 'path';
import jsonfile from 'jsonfile';
import npm from 'npm';
import semver from 'semver';
import readPkgUp from 'read-pkg-up';
import findUp from 'find-up';
import resolveFrom from 'resolve-from';

const replaceRequirePath = path.resolve(__dirname, 'replace-require-codeshift.js');

const helpers = {
  pack,
  sanitizeModuleName,
  getTarFilePath,
  untar,
  installModule,
  installDeps,
  existsInNodeModules,
  getPathToModule,
  getDestinationPath,
  replaceModuleRequires
};

function pack(moduleName: string) {
  exec(`npm pack ${moduleName}`, (err, stdout, stderr) => {
    if (err) {
      throw new Error(err);
    }
  });
}

// remove leading "@" for namespaced modules
// replace "@" used for versioned modules
function sanitizeModuleName(moduleName: string): string {
  return moduleName.replace(/^@/, '').replace(/@|\//g, '-');
}

function getTarFilePath(moduleName: string, cwd: string = ''): string {
  const sanitizedModuleName = sanitizeModuleName(moduleName);
  const globbyPath = path.join(cwd, `${sanitizedModuleName}*.tgz`);
  const filePath = globby.sync(globbyPath)[0];
  return filePath;
}

function untar(moduleName: string) {
  // example: parachute-1.0.0.tgz
  fs.createReadStream(getTarFilePath(moduleName))
    .pipe(extract(moduleName));
}

/* eslint-disable max-len */
function installModule(moduleName: string, moduleVersion: string, cb: Function = () => {}): void {
/* eslint-enable max-len */
  npm.load({save: true}, (err) => {
    if (err) {
      throw err;
    }
    const module = moduleVersion ? `${moduleName}@${moduleVersion}` : moduleName;
    // install module
    npm.commands.install([module], (err1, data) => {
      // log errors or data
      console.log(err1, data);
      cb();
    });
    npm.on('log', (message) => {
      // log installation progress
      console.log(message);
    });
  });
}

// passes error, if any, into a callback function
/* eslint-disable max-len */
function installDeps(newPackageContent: any, cb: Function = () => {}) {
  const existingPackageContent = readPkgUp.sync({cwd: process.cwd()}).pkg;
  const existingDeps = existingPackageContent && existingPackageContent.dependencies || {};
  const newDeps = newPackageContent.dependencies || {};
  const newDepKeys = Object.keys(newDeps);
  let gotConflict = false;
  const installationCount = newDepKeys.length;
  let installationFinished = 0;

  if (!installationCount) {
    return cb();
  }

  function onInstallModule() {
    installationFinished += 1;
    if (installationFinished === installationCount && !gotConflict) {
      return cb();
    }
    return null;
  }

  newDepKeys.forEach((dep) => {
    if (gotConflict) {
      return null;
    }
    if (!existingDeps.hasOwnProperty(dep)) {
      console.log(`Installing module ${dep}@${newDeps[dep]}`);
      helpers.installModule(dep, newDeps[dep], onInstallModule);
    } else {
      const installedPkg = findUp.sync(path.join('node_modules', dep, 'package.json'),
        {cwd: process.cwd()});
      if (installedPkg) {
        const installedVersion = jsonfile.readFileSync(installedPkg).version;
        if (!semver.satisfies(installedVersion, newDeps[dep])) {
          gotConflict = true;
          /* eslint-disable max-len */
          return cb(new Error(`Installed ${dep}@${installedVersion} version conflicts with the required version ${newDeps[dep]}.`));
          /* eslint-enable max-len */
        }
        onInstallModule();
      } else {
        /* eslint-disable max-len */
        return cb(new Error('Install all dependencies in your current project before running instafork.'));
        /* eslint-enable max-len */
      }
    }
    return null;
  });
  return null;
}

// TODO: support namespaces and versions ("@uber/react-anchor", "express@1.0.0", etc.)
function existsInNodeModules(moduleName: string) {
  const resolvePath = resolveFrom(process.cwd(), moduleName);
  if (typeof resolvePath === 'string') {
    return true;
  }
  return false;
}

// assumes module already exists in node_modules
function getPathToModule(moduleName: string) {
  return path.join(findUp.sync('node_modules'), moduleName);
}

function getDestinationPath(moduleName: string) {
  if (fs.existsSync('src')) {
    console.log('"src" dir found in local directory');
    return path.join(process.cwd(), 'src', moduleName);
  }
  return path.join(process.cwd(), moduleName);
}

// Replace requires and imports with new file path
/* eslint-disable max-len */
function replaceModuleRequires(moduleName: string, newModulePath: string, cb: Function) {
/* eslint-enable max-len */
  const optionsString = `--toReplace="${moduleName}" --replaceWith="${newModulePath}"`;
  const jscodeshiftPath = path.join(__dirname, '..', '..', 'node_modules', '.bin', 'jscodeshift');
  const execString = `${jscodeshiftPath} -t ${replaceRequirePath} *.js **/*.js ${optionsString}`;
  console.log('execString: ', execString);

  exec(execString, (err, stdout, stderr) => {
    if (err) {
      return cb(new Error(err));
    }
    return cb();
  });
}

module.exports = helpers;
