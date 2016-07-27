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
import globby from 'globby';
import path from 'path';
import jsonfile from 'jsonfile';
import fs from 'fs';

import helpers from './helpers';

class PackageTar {
  moduleName: string;
  tarFileName: string;
  tempDirName: string = 'instafork-temp';
  untarredFilePath: string;

  constructor(moduleName: string): void {
    this.moduleName = moduleName;
    this.tarFileName = '';
  }

  fetchFromRegistry(cb: Function): void {
    const command = `npm pack ${this.moduleName}`;
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.log('Error executing command:', command);
        console.log('Stderr:', stderr);
        throw err;
      }
      console.log('fetchFromRegistry Stdout:', stdout);
      this.tarFileName = helpers.getTarFilePath(this.moduleName, process.cwd());
      cb(this.tarFileName);
    });
  }

  // calls cb with the package.json content of the modules
  untar(cb: Function): void {
    // TODO: replace with window's friendly tar
    const tempDirPath = path.join(process.cwd(), this.tempDirName);
    fs.mkdirSync(tempDirPath);
    const command = `tar -xvzf ${this.tarFileName} -C ${tempDirPath}`;
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error('Error executing command:', command);
        console.error('untar Stderr:', stderr);
        throw err;
      }
      console.log('untar Stdout:', stdout);
      this.untarredFilePath = globby.sync(path.join(process.cwd(), this.tempDirName, '*'))[0];
      const pkg = jsonfile.readFileSync(path.join(
        this.untarredFilePath, 'package.json'));
      cb(pkg);
    });
  }
}

export default PackageTar;
