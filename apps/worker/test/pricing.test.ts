import { CONDITION_MULTIPLIER, iqrTrim, median, normalizeCondition, suggestPrice } from '../src/lib/pricing';

describe('normalizeCondition', () => {
  it('maps descriptive phrases to expected codes', () => {
    expect(normalizeCondition('Brand new sealed')).toBe('new');
    expect(normalizeCondition('Open box like new')).toBe('like_new');
    expect(normalizeCondition('Very good condition')).toBe('very_good');
    expect(normalizeCondition('Heavy wear acceptable')).toBe('acceptable');
    expect(normalizeCondition('For spares only')).toBe('for_parts');
  });
});

describe('iqrTrim', () => {
  it('removes outliers outside of IQR band', () => {
    const values = [10, 12, 12, 13, 50, 11, 10];
    const trimmed = iqrTrim(values);
    expect(trimmed).toEqual([10, 10, 11, 12, 12, 13]);
  });
});

describe('median', () => {
  it('returns central value for odd counts', () => {
    expect(median([1, 5, 3])).toBe(3);
  });

  it('averages two middle numbers for even counts', () => {
    expect(median([1, 3, 2, 4])).toBe(2.5);
  });
});

describe('suggestPrice', () => {
  const comps = [
    { price: 100, condition: 'new' },
    { price: 80, condition: 'very_good' },
    { price: 75, condition: 'good' },
    { price: 60, condition: 'acceptable' },
    { price: 20, condition: 'for_parts' },
  ];

  it('balances comps and cost guardrails', () => {
    const price = suggestPrice({
      comps,
      targetCondition: 'good',
      cogs: 30,
      targetMarginPct: 0.35,
      rrp: 120,
      expected: 95,
      floorPctOverCogs: 0.1,
      ceilPctOfRrp: 0.9,
    });
    expect(price).toBeGreaterThan(40);
    expect(price).toBeLessThanOrEqual(108);
  });

  it('snaps to psychological endings', () => {
    const price = suggestPrice({
      comps,
      targetCondition: 'good',
      cogs: 25,
      targetMarginPct: 0.25,
    });
    expect(price).toMatch(/\.99$/);
  });

  it('handles missing signals gracefully', () => {
    const price = suggestPrice({
      comps: [{ price: 20 }],
    });
    expect(price).toBeCloseTo(19.99, 2);
  });
});

it('exposes full multiplier table for price scaling', () => {
  expect(Object.keys(CONDITION_MULTIPLIER)).toContain('like_new');
  expect(CONDITION_MULTIPLIER.good).toBeGreaterThan(0);
});
