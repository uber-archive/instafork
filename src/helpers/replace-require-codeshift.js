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

import path from 'path';

function replaceImport(source, j, opts) {
  // const replaceWith = opts.newPackage;
  return j(source)
    .find(j.ImportDeclaration)
    .find(j.Literal, {
      value: opts.toReplace
    })
    .replaceWith(
      p => {
        return j.literal(opts.replaceWith);
      }
    )
  .toSource({quote: 'single'});
}

function replaceRequire(source, j, opts) {
  // const replaceWith = opts.newPackage;
  return j(source)
    .find(j.VariableDeclaration)
    .find(j.Literal, {
      value: opts.toReplace
    })
    .replaceWith(
      p => {
        return j.literal(opts.replaceWith);
      }
    )
  .toSource({quote: 'single'});
}

// prepend "./" if path is not led by "../"
const prependDotSlash = (p) => (/^\.\.\//.test(p) ? p : `./${p}`);

export default function transform(file, api, opts) {
  const j = api.jscodeshift;
  const source = file.source;

  const currentFilePath = path.join(process.cwd(), file.path);
  opts.replaceWith = prependDotSlash(path.relative(
    path.dirname(currentFilePath), opts.replaceWith));

  let newSource = replaceImport(source, j, opts);
  newSource = replaceRequire(newSource, j, opts);

  return newSource;
}
