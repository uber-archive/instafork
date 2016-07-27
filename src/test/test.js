// @flow
import test from 'tape';
import {getTarFilePath} from '../helpers/helpers';
import path from 'path';

test('getTarFilePath', function t(assert) {
  assert.true(getTarFilePath(path.join(__dirname, 'fixtures', 'pkg')), 'fixtures/pkg-0.0.0.tgz');
  assert.end();
});
