import test from 'node:test';
import assert from 'node:assert';
import app from '../src/app.js';

test('Auth: Login with dr.anindya and password nakes', async () => {
  const req = {
    body: { username: 'dr.anindya', password: 'nakes' }
  };
  let statusCode = 0;
  let responseData = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };

  const { login } = await import('../src/controllers/authController.js');
  await login(req, res, () => {});

  assert.strictEqual(statusCode, 200);
  assert.strictEqual(responseData.success, true);
  assert.strictEqual(responseData.data.user.username, 'dr.anindya');
  assert.strictEqual(responseData.data.user.role, 'clinical_reviewer');
});

test('Auth: Login with dr.budi and dr.ratna with nakes password', async () => {
  const { login } = await import('../src/controllers/authController.js');

  for (const docUser of ['dr.budi', 'dr.ratna']) {
    let statusCode = 0;
    let responseData = null;
    const res = {
      status(code) { statusCode = code; return this; },
      json(data) { responseData = data; return this; }
    };

    await login({ body: { username: docUser, password: 'nakes' } }, res, () => {});
    assert.strictEqual(statusCode, 200);
    assert.strictEqual(responseData.success, true);
    assert.strictEqual(responseData.data.user.username, docUser);
  }
});

test('Auth: Login with staff.jkn and password jkn', async () => {
  const { login } = await import('../src/controllers/authController.js');
  let statusCode = 0;
  let responseData = null;
  const res = {
    status(code) { statusCode = code; return this; },
    json(data) { responseData = data; return this; }
  };

  await login({ body: { username: 'staff.jkn', password: 'jkn' } }, res, () => {});
  assert.strictEqual(statusCode, 200);
  assert.strictEqual(responseData.success, true);
  assert.strictEqual(responseData.data.user.username, 'staff.jkn');
  assert.strictEqual(responseData.data.user.role, 'staff_jkn');
});
