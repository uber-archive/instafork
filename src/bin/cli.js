#!/usr/bin/env node

const meow = require('meow');
const parachute = require('../parachute');

const cli = meow(`
usage
  $ parachute [<npm module name>,]

Examples
  $ parachute e
  //=> create new task

Commands
  clear:  empty saved config
  config-task:  print filepath to the config file

Options
  -d, --dry  Prints "createtask" object without task creation on Phabricator`,
  {
    alias: {
      d: 'dry'
    }
  }
);

parachute(cli.input, cli.flags);
