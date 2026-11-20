import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFxReturn,
  calculateLoanInstallment,
  calculateVaultDenominations,
  evaluateCustomerDecision,
  getCurrentRank,
  getNextRank,
  requiresDualApproval,
} from './rules';
import { SCRIPTED_SCENARIOS } from './scenarios';

test('rank progression moves from Gişe Yetkilisi up to Bölge Müdürü', () => {
  assert.equal(getCurrentRank(0).level, 1);
  assert.equal(getCurrentRank(0).title, 'Gişe Yetkilisi');
  assert.equal(getNextRank(0)?.level, 2);

  assert.equal(getCurrentRank(100).level, 2);
  assert.equal(getCurrentRank(250).level, 3);
  assert.equal(getCurrentRank(450).level, 4);
  assert.equal(getCurrentRank(700).level, 5);
  assert.equal(getCurrentRank(1000).level, 6);
  assert.equal(getCurrentRank(1200).title, 'Bölge Müdürü');
  assert.equal(getNextRank(1000), null);
});

test('loan installment calculator detects DTI limit breach above 50%', () => {
  const safe = calculateLoanInstallment(150_000, 12, 3.89, 85_000, 3_500);
  assert.equal(safe.isOverLimit, false);
  assert.ok(safe.monthlyPayment > 12_000 && safe.monthlyPayment < 20_000);

  const risky = calculateLoanInstallment(400_000, 18, 4.2, 44_000, 11_500);
  assert.equal(risky.isOverLimit, true);
  assert.ok(risky.dtiPercent > 50);
});

test('FX calculation returns rounded TRY amount', () => {
  assert.equal(calculateFxReturn(34.2, 2500), 85_500);
  assert.equal(calculateFxReturn(36.1, 1000), 36_100);
});

test('vault denominations always sum exactly to total cash', () => {
  const totals = [1_250_000, 1_290_000, 987_650];
  for (const total of totals) {
    const rows = calculateVaultDenominations(total);
    const sum = rows.reduce((acc, r) => acc + r.total, 0);
    assert.equal(sum, total);
  }
});

test('dual approval triggers only on valid approvals above current rank limit', () => {
  const highLoan = SCRIPTED_SCENARIOS.find((s) => s.ticket === 'B-203')!;
  assert.equal(requiresDualApproval(highLoan, 'approve', 150_000), true);
  assert.equal(requiresDualApproval(highLoan, 'approve', 500_000), false);
  assert.equal(requiresDualApproval(highLoan, 'reject', 150_000), false);
});

test('decision evaluation scores accurate approvals, exact reject reasons, and MASAK reports', () => {
  const cleanDeposit = SCRIPTED_SCENARIOS.find((s) => s.ticket === 'G-101')!;
  const resOk = evaluateCustomerDecision(cleanDeposit, 'approve', null);
  assert.equal(resOk.ok, true);
  assert.equal(resOk.xpDelta, 45);
  assert.equal(resOk.cashDelta, 40_000);

  const expiredId = SCRIPTED_SCENARIOS.find((s) => s.ticket === 'G-103')!;
  const wrongReason = evaluateCustomerDecision(expiredId, 'reject', 'fake_cash');
  assert.equal(wrongReason.ok, false);
  assert.equal(wrongReason.xpDelta, -15);

  const rightReason = evaluateCustomerDecision(expiredId, 'reject', 'expired_id');
  assert.equal(rightReason.ok, true);
  assert.equal(rightReason.xpDelta, 45);

  const masakCase = SCRIPTED_SCENARIOS.find((s) => s.ticket === 'K-301')!;
  const masakRes = evaluateCustomerDecision(masakCase, 'masak', null);
  assert.equal(masakRes.ok, true);
  assert.equal(masakRes.xpDelta, 75);
});
