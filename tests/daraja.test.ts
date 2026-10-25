import { describe, it, expect } from 'vitest';
import { normalizeKenyanPhone, maskPhoneInPayload } from '@/lib/payments/daraja';

describe('Safaricom M-Pesa Daraja Payment Adapter', () => {
  it('normalizes various Kenyan phone number formats to E.164 254XXXXXXXXX', () => {
    // 07 format
    expect(normalizeKenyanPhone('0712345678')).toBe('254712345678');
    // 01 format (newer Safaricom / Airtel series)
    expect(normalizeKenyanPhone('0110123456')).toBe('254110123456');
    // 254 format with spaces or dashes
    expect(normalizeKenyanPhone('254 722 000 000')).toBe('254722000000');
    expect(normalizeKenyanPhone('+254-700-111-222')).toBe('254700111222');
    // 9-digit format
    expect(normalizeKenyanPhone('799888777')).toBe('254799888777');
  });

  it('rejects invalid or non-Kenyan phone numbers', () => {
    expect(() => normalizeKenyanPhone('12345')).toThrow(/Invalid Kenyan M-Pesa phone number/);
    expect(() => normalizeKenyanPhone('0201234567')).toThrow(/Invalid Kenyan M-Pesa phone number/);
    expect(() => normalizeKenyanPhone('+14155552671')).toThrow(/Invalid Kenyan M-Pesa phone number/);
  });

  it('masks sensitive phone digits in callback payloads for Kenya Data Protection compliance', () => {
    const rawPayload = JSON.stringify({
      PhoneNumber: 254712345678,
      Amount: 500,
      MpesaReceiptNumber: 'SLK9A8F76G',
    });

    const sanitized = maskPhoneInPayload(rawPayload);
    expect(sanitized).not.toContain('254712345678');
    expect(sanitized).toContain('25471****678');
    expect(sanitized).toContain('SLK9A8F76G');
  });
});
