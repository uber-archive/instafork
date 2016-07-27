// @flow
import {exec} from 'child_process';
import {extract} from 'tar-fs';
import fs from 'fs';
import glob from 'glob';
import path from 'path';

module.exports = {
  pack: function pack(moduleName: string) {
    exec(`npm pack ${moduleName}`, (err, stdout, stderr) => {
      if (err) {
        throw new Error(err);
      }
    });
  },

  getTarFilePath: function getTarFilePath(moduleName: string) {
    // TODO: replace with more robust method for determining what the name
    // of the tarfile downloaded was
    // Would break if you happened to have moduleName-* in current directory
    const modulePattern = path.resolve(`${moduleName}-*`);
    return glob.sync(modulePattern)[0];
  },

  untar: function untar(moduleName: string) {
    // example: parachute-1.0.0.tgz
    fs.createReadStream(this.getTarFilePath(moduleName))
      .pipe(extract(moduleName));
  }
};
