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

import PackageTar from './helpers/package-tar';
import path from 'path';
import fs from 'fs-extra';
import jsonfile from 'jsonfile';

import {
  existsInNodeModules,
  getPathToModule,
  getDestinationPath,
  replaceModuleRequires,
  installDeps
} from './helpers/helpers';

/* eslint-disable max-len */
function instafork(moduleName: string, opts: any, logger: ?{log: Function} = null, cb: Function = () => {}) {
/* eslint-enable max-len */
  const packageTar = new PackageTar(moduleName);

  const destinationPath = getDestinationPath(moduleName);

  if (logger) {
    logger.log(moduleName, null, () => {});
  }

  function cleanup() {
    fs.removeSync(packageTar.tempDirName);
    fs.removeSync(packageTar.tarFileName);
  }

  function logError(err = {}) {
    if (logger) {
      logger.log(moduleName, err.message, () => {
        throw err;
      });
    } else {
      throw err;
    }
  }

  if (existsInNodeModules(moduleName)) {
    console.log('Copying module from node_modules...');
    fs.copy(getPathToModule(moduleName), destinationPath, function copyModule(err) {
      if (err) {
        logError(err);
      }
      const packageContent = jsonfile.readFileSync(path.join(destinationPath, 'package.json'));
      installDeps(packageContent, (installErr) => {
        if (installErr) {
          logError(installErr);
        }
        // replace requires/imports
        const newModulePath = path.join(destinationPath, packageContent.main || 'index.js');
        replaceModuleRequires(moduleName, newModulePath, () => {
          cb();
        });
      });
    });
  } else {
    console.log('Downloading module from remote...');

    packageTar.fetchFromRegistry((zippedFileName: string) => {
      // untar into tempDir (since tar doesn't untar
      // to a predictable directory name)
      packageTar.untar((packageContent) => {

        installDeps(packageContent, (err) => {
          if (err) {
            cleanup();
            logError(err);
          }

          fs.copySync(packageTar.untarredFilePath, destinationPath);

          // replace requires/imports
          const newModulePath = path.join(destinationPath, packageContent.main || 'index.js');
          /* eslint-disable max-nested-callbacks */
          replaceModuleRequires(moduleName, newModulePath, () => {
            cleanup();
            cb();
          });
          /* eslint-enable max-nested-callbacks */
        });
      });
    });
  }
}

module.exports = instafork;
