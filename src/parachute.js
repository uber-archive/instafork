// @flow

// import pkg from '../package.json';
import {pack, untar} from './helpers/helpers';

// npm pack "$1"
// tar -xvzf *.tgz
// # Get accurate file path for where files lie
// # Copy files to wherever it should go
// # get deps from package.json
// # npm install --save each dep

// take in moduleName, return tarred file path
function parachute(input: string, opts: any) {
  const moduleName = input[0];
  pack(moduleName);
  untar(moduleName);
  console.log('parachute.js');
}

module.exports = parachute;
