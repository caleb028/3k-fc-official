import { describe, it, expect } from 'vitest';
import { awardOrAdjustLoyaltyPoints } from '@/lib/loyalty/service';

describe('Auditable Loyalty Points Engine', () => {
  it('throws an error if points delta is zero or non-integer', async () => {
    await expect(
      awardOrAdjustLoyaltyPoints({
        userId: 'usr-123',
        idempotencyKey: 'test-key-1',
        eventType: 'MATCH_ATTENDANCE_VERIFIED',
        pointsDelta: 0,
        reason: 'Test zero delta',
      })
    ).rejects.toThrow(/Points delta must be a non-zero integer/);

    await expect(
      awardOrAdjustLoyaltyPoints({
        userId: 'usr-123',
        idempotencyKey: 'test-key-2',
        eventType: 'MATCH_ATTENDANCE_VERIFIED',
        pointsDelta: 12.5 as any,
        reason: 'Test float delta',
      })
    ).rejects.toThrow(/Points delta must be a non-zero integer/);
  });

  it('requires a clear administrative or event reason', async () => {
    await expect(
      awardOrAdjustLoyaltyPoints({
        userId: 'usr-123',
        idempotencyKey: 'test-key-3',
        eventType: 'MATCH_ATTENDANCE_VERIFIED',
        pointsDelta: 10,
        reason: '',
      })
    ).rejects.toThrow(/A clear reason is required/);
  });

  it('rejects manual adjustments without an authorized staff actor', async () => {
    await expect(
      awardOrAdjustLoyaltyPoints({
        userId: 'usr-123',
        idempotencyKey: 'test-key-4',
        eventType: 'ADMIN_MANUAL_ADJUSTMENT',
        pointsDelta: 100,
        reason: 'Manual adjustment without actor',
      })
    ).rejects.toThrow(/require an authorized staff actor/);
  });
});
