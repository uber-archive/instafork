# instafork

> Instantly copy the source of an npm module locally

[![Build Status](https://travis-ci.org/uber-web/instafork.svg?branch=master)](https://travis-ci.org/uber-web/instafork)
[![Coverage Status](https://coveralls.io/repos/github/uber-web/instafork/badge.svg?branch=master)](https://coveralls.io/github/uber-web/instafork?branch=master)

:warning: Use with caution. Instafork is pre-1.0.0 and the api will likely change :warning:

Injects package content into your file system. Think of it like a fork, except there is no publish step since all module files are in your project source. This means a package is immediately editable for quick iteration.

## Installation

```
npm install --global instafork
```

## Usage

```
Usage
  $ instafork <npm module name>

Examples
  $ instafork express
  //=> Eject contents of express in current directory

  $ mkdir src && instafork express
  //=> Eject contents of express into ./src instead if it exists
```

## FAQ

* What operating systems are supported?
  * Unix and Linux. Windows is not supported because it handles `tar` files different from how *nix systems, so that is left out. PR's welcome.

* Why eject to `./src` if that directory exists?
  * If you have a `src` directory in your current file location, it's likely you're using some type of build process like babel. Because of this, you can collocate and transpile your newly instaforked module all from `src`.

## API
  Instafork accepts a custom logger object in case you want to log it's usage. The logger passed in has to have a `log` method that will be called with three arguments:

  ```js
  /**
   * @param {string} packageName The name of a package that is being ejected.
   * @param {string} errorMessage The error message if any while ejecting a package.
   * @param {Function} cb A callback function that needs to be called
   */
  class Logger {
    log(packageName, errorMessage, cb) {
      console.log(package, errorMessage);
      cb();
    }
  }
  ```

  Create a wrapper on top of instafork and pass in your custom Logger:

  ```js
  const instafork = require('instafork');
  const logger = new Logger();

  instafork(cliInput, cliOptions, logger);
  ```

## Development

This project was developed with [flow](https://flowtype.org/). Ensure that `flow check` passes in your contribution. It's included in `npm test` for you already.

#### Test

```
npm test
```

Flow alone:

```
npm run flow
```

Eslint alone:

```
npm run lint
```
