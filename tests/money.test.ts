import { describe, it, expect } from 'vitest';
import {
  kesToCents,
  centsToWholeKes,
  formatKes,
  addMoneyCents,
  multiplyMoneyCents,
  calculatePercentageDiscountCents,
} from '@/lib/money';

describe('Financial Minor-Units Money Engine', () => {
  it('converts whole integer KES to minor unit cents (1 KES = 100 cents)', () => {
    expect(kesToCents(200)).toBe(20000);
    expect(kesToCents(1500)).toBe(150000);
    expect(kesToCents(0)).toBe(0);
  });

  it('rejects floating-point or negative amounts when converting whole KES to cents', () => {
    expect(() => kesToCents(1500.5)).toThrow(/Invalid whole KES integer amount/);
    expect(() => kesToCents(-100)).toThrow(/Invalid whole KES integer amount/);
  });

  it('converts integer cents back to whole KES', () => {
    expect(centsToWholeKes(20000)).toBe(200);
    expect(centsToWholeKes(150050)).toBe(1500); // 1500 KES truncating minor cents
    expect(centsToWholeKes(0)).toBe(0);
  });

  it('formats KES currency strings reliably', () => {
    expect(formatKes(20000)).toBe('KES 200');
    expect(formatKes(250000)).toBe('KES 2,500');
    expect(formatKes(0)).toBe('KES 0');
  });

  it('performs exact addition and multiplication on integer minor cents', () => {
    expect(addMoneyCents(20000, 5000, 1500)).toBe(26500);
    expect(multiplyMoneyCents(35000, 3)).toBe(105000);
  });

  it('calculates integer percentage discounts without float drift', () => {
    // 10% discount on KES 3,500 (350000 cents) = 35000 cents (KES 350)
    expect(calculatePercentageDiscountCents(350000, 10)).toBe(35000);
    // 15% discount on KES 200 (20000 cents) = 3000 cents (KES 30)
    expect(calculatePercentageDiscountCents(20000, 15)).toBe(3000);
  });
});
