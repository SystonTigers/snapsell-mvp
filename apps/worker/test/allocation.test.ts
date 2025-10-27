import { allocateCost } from '../src/lib/allocation';

describe('allocateCost', () => {
  const baseLines = [
    { lineId: 'a', qty: 2, weight: 1.2, declaredValue: 40, rrp: 60, expected: 55 },
    { lineId: 'b', qty: 1, weight: 0.8, declaredValue: 30, rrp: 40, expected: 35 },
    { lineId: 'c', qty: 3, weight: 2.5, declaredValue: 90, rrp: 120, expected: 110 },
  ];

  it('allocates by units', () => {
    const result = allocateCost('units', baseLines, 100);
    expect(result).toHaveLength(3);
    const total = result.reduce((sum, line) => sum + line.allocated, 0);
    expect(total).toBeCloseTo(100, 2);
    expect(result.find((line) => line.lineId === 'c')?.allocated).toBeGreaterThan(
      result.find((line) => line.lineId === 'b')?.allocated ?? 0,
    );
  });

  it('allocates by weight', () => {
    const result = allocateCost('weight', baseLines, 75);
    expect(result.find((line) => line.lineId === 'c')?.allocated).toBeGreaterThan(
      result.find((line) => line.lineId === 'b')?.allocated ?? 0,
    );
  });

  it('allocates by declared value', () => {
    const result = allocateCost('value', baseLines, 200);
    expect(result.find((line) => line.lineId === 'a')?.allocated).toBeLessThan(
      result.find((line) => line.lineId === 'c')?.allocated ?? 0,
    );
  });

  it('allocates by expected resale signal', () => {
    const result = allocateCost('expected', baseLines, 150);
    expect(result.find((line) => line.lineId === 'a')?.allocated).toBeLessThan(
      result.find((line) => line.lineId === 'c')?.allocated ?? 0,
    );
  });

  it('supports manual overrides', () => {
    const lines = baseLines.map((line, index) => ({ ...line, manualShare: index === 0 ? 70 : 15 }));
    const result = allocateCost('manual', lines, 60);
    expect(result.find((line) => line.lineId === 'a')?.allocated).toBeCloseTo(42, 2);
  });

  it('falls back to even split when basis is zero', () => {
    const lines = baseLines.map((line) => ({ ...line, qty: 0, weight: 0, declaredValue: 0, rrp: 0, expected: 0 }));
    const result = allocateCost('units', lines, 30);
    result.forEach((line) => expect(line.allocated).toBeCloseTo(10, 2));
  });

  it('throws when total cost negative', () => {
    expect(() => allocateCost('units', baseLines, -1)).toThrowError(/non-negative/);
  });
});
