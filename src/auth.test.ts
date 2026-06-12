import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractBearerToken, verifyBearerToken } from './auth.js';

describe('auth', () => {
  it('extracts bearer token', () => {
    assert.equal(extractBearerToken('Bearer secret-key'), 'secret-key');
    assert.equal(extractBearerToken('bearer abc'), 'abc');
    assert.equal(extractBearerToken(undefined), null);
    assert.equal(extractBearerToken('Basic x'), null);
  });

  it('verifies matching bearer token with timing-safe compare', () => {
    assert.equal(verifyBearerToken('secret-key', 'secret-key'), true);
    assert.equal(verifyBearerToken('wrong', 'secret-key'), false);
    assert.equal(verifyBearerToken(null, 'secret-key'), false);
    assert.equal(verifyBearerToken('short', 'longer-key'), false);
  });
});
