const { describe, it, expect } = require('vitest');
const { wouldViolateRetention } = require('./retention');

describe('wouldViolateRetention', () => {
  it('returns false when the remaining quantity is exactly at the retention minimum', () => {
    expect(wouldViolateRetention(10, 3, 7)).toBe(false);
  });

  it('returns true when the remaining quantity is exactly one below the retention minimum', () => {
    expect(wouldViolateRetention(10, 3, 8)).toBe(true);
  });

  it('returns false when the remaining quantity is comfortably above the retention minimum', () => {
    expect(wouldViolateRetention(10, 3, 2)).toBe(false);
  });

  it('returns true when removing more than is currently in stock', () => {
    expect(wouldViolateRetention(5, 3, 10)).toBe(true);
  });

  it('returns false when removing zero and current stock already meets the minimum', () => {
    expect(wouldViolateRetention(3, 3, 0)).toBe(false);
  });

  it('returns true when removing zero but current stock is already below the minimum', () => {
    expect(wouldViolateRetention(2, 3, 0)).toBe(true);
  });

  it('returns false for a retentionMin of 0, as long as stock does not go negative', () => {
    expect(wouldViolateRetention(5, 0, 5)).toBe(false);
  });

  it('returns true for a retentionMin of 0 when the removal would take stock negative', () => {
    expect(wouldViolateRetention(5, 0, 6)).toBe(true);
  });

  it('treats a negative currentQuantity as already violating, regardless of quantityRemoved', () => {
    expect(wouldViolateRetention(-1, 0, 0)).toBe(true);
  });
});