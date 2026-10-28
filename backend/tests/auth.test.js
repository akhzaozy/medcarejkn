import test from 'node:test';import assert from 'node:assert/strict';
import {sanitizeUser} from '../src/auth/session.js';
import {publicUser} from '../../shared/userIdentity.js';
test('BUG-09: response and legacy browser identity remove credentials',()=>{const input={id:'test',username:'test',name:'Test',role:'staff_jkn',password:'should-not-survive',password_hash:'should-not-survive',salt:'should-not-survive',resetToken:'should-not-survive'};for(const clean of [sanitizeUser(input),publicUser(input)]){assert.deepEqual(Object.keys(clean).sort(),['id','name','role','username']);assert.equal(JSON.stringify(clean).includes('should-not-survive'),false);}});
