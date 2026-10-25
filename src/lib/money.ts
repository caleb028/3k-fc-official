/**
 * Integer Minor-Unit Financial Utilities (KES Cents)
 * Strictly avoids floating-point arithmetic for all monetary calculations.
 * 1 KES = 100 Cents (e.g., KES 500 = 50000 cents).
 */

export function kesToCents(wholeKes: number): number {
  if (!Number.isInteger(wholeKes) || wholeKes < 0) {
    throw new Error(`Invalid whole KES integer amount: ${wholeKes}`);
  }
  return wholeKes * 100;
}

export function centsToWholeKes(cents: number): number {
  if (!Number.isInteger(cents)) {
    throw new Error(`Monetary value must be stored in integer minor units (cents): ${cents}`);
  }
  return Math.trunc(cents / 100);
}

export function addMoneyCents(...amounts: number[]): number {
  let sum = 0;
  for (const amt of amounts) {
    if (!Number.isInteger(amt)) {
      throw new Error(`Non-integer monetary amount encountered: ${amt}`);
    }
    sum += amt;
  }
  return sum;
}

export function multiplyMoneyCents(unitPriceCents: number, quantity: number): number {
  if (!Number.isInteger(unitPriceCents) || !Number.isInteger(quantity) || quantity < 0) {
    throw new Error(`Invalid unit price (${unitPriceCents}) or quantity (${quantity})`);
  }
  return unitPriceCents * quantity;
}

export function calculatePercentageDiscountCents(amountCents: number, discountPercent: number): number {
  if (!Number.isInteger(amountCents) || !Number.isInteger(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    throw new Error(`Invalid discount parameters: amount=${amountCents}, percent=${discountPercent}`);
  }
  return Math.trunc((amountCents * discountPercent) / 100);
}

export function formatKes(cents: number, showMinorUnits = false): string {
  if (!Number.isInteger(cents)) {
    throw new Error(`formatKes requires integer cents, received: ${cents}`);
  }
  const sign = cents < 0 ? '-' : '';
  const absCents = Math.abs(cents);
  const wholeKes = Math.trunc(absCents / 100);
  const remainderCents = absCents % 100;
  const formattedWhole = wholeKes.toLocaleString('en-KE');
  if (showMinorUnits || remainderCents !== 0) {
    return `${sign}KES ${formattedWhole}.${String(remainderCents).padStart(2, '0')}`;
  }
  return `${sign}KES ${formattedWhole}`;
}
