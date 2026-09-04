import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parsePositiveInt, requireEnv } from './config.js';

describe('config helpers', () => {
  it('requireEnv returns trimmed value', () => {
    process.env.TEST_REQUIRE_ENV = '  secret  ';
    assert.equal(requireEnv('TEST_REQUIRE_ENV'), 'secret');
    delete process.env.TEST_REQUIRE_ENV;
  });

  it('requireEnv throws when missing', () => {
    delete process.env.TEST_MISSING_ENV;
    assert.throws(
      () => requireEnv('TEST_MISSING_ENV'),
      /Missing required environment variable: TEST_MISSING_ENV/
    );
  });

  it('parsePositiveInt uses fallback for invalid values', () => {
    assert.equal(parsePositiveInt(undefined, 3000), 3000);
    assert.equal(parsePositiveInt('', 3000), 3000);
    assert.equal(parsePositiveInt('abc', 3000), 3000);
    assert.equal(parsePositiveInt('-1', 3000), 3000);
    assert.equal(parsePositiveInt('0', 3000), 3000);
  });

  it('parsePositiveInt parses valid integers', () => {
    assert.equal(parsePositiveInt('8080', 3000), 8080);
    assert.equal(parsePositiveInt('25', 10), 25);
  });
});
