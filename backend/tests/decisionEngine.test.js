import test from 'node:test';
import assert from 'node:assert';
import { reconcileItem } from '../src/decision-engine/evidenceReconciliation.js';

test('Decision Engine: Full Support', () => {
  const res = reconcileItem({ claimedQty: 5, supportedQty: 5, evidenceAvailable: 'YES' });
  assert.strictEqual(res.status, 'SUPPORTED');
  assert.strictEqual(res.gap, 0);
  assert.strictEqual(res.coveragePct, 100);
  assert.strictEqual(res.reviewPriority, 'LOW');
});

test('Decision Engine: Partial Support', () => {
  const res = reconcileItem({ claimedQty: 5, supportedQty: 2, evidenceAvailable: 'YES' });
  assert.strictEqual(res.status, 'PARTIAL');
  assert.strictEqual(res.gap, 3);
  assert.strictEqual(res.coveragePct, 40);
  assert.strictEqual(res.reviewPriority, 'MEDIUM');
  assert.strictEqual(res.primarySignal, 'PARTIAL_SUPPORT');
});

test('Decision Engine: Phantom Billing (CASE-0025 Scenario)', () => {
  const res = reconcileItem({ claimedQty: 5, supportedQty: 0, evidenceAvailable: 'YES' });
  assert.strictEqual(res.status, 'UNSUPPORTED');
  assert.strictEqual(res.gap, 5);
  assert.strictEqual(res.coveragePct, 0);
  assert.strictEqual(res.primarySignal, 'PHANTOM_BILLING');
  assert.strictEqual(res.reviewPriority, 'HIGH');
});

test('Decision Engine: Safety Guardrail for Unavailable Evidence (CASE-0033 Scenario)', () => {
  const res = reconcileItem({ claimedQty: 5, supportedQty: 0, evidenceAvailable: 'NO' });
  assert.strictEqual(res.status, 'UNAVAILABLE');
  assert.strictEqual(res.reviewPriority, 'NO_CONCLUSION');
  assert.strictEqual(res.primarySignal, null);
});

test('Decision Engine: Pattern Review (CASE-0037 Scenario)', () => {
  const res = reconcileItem({
    claimedQty: 5,
    supportedQty: 5,
    evidenceAvailable: 'YES',
    utilizationSignal: true
  });
  assert.strictEqual(res.status, 'SUPPORTED');
  assert.strictEqual(res.primarySignal, 'PATTERN_REVIEW');
  assert.strictEqual(res.reviewPriority, 'MEDIUM');
});
