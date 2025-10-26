export type AllocationMethod = 'units' | 'weight' | 'value' | 'rrp' | 'expected' | 'manual';

export interface AllocationLine {
  lineId: string;
  qty: number;
  weight?: number | null;
  declaredValue?: number | null;
  rrp?: number | null;
  expected?: number | null;
  manualShare?: number | null;
}

export interface AllocationResult {
  lineId: string;
  share: number;
  allocated: number;
}

const ensurePositive = (value: number | null | undefined): number | undefined => {
  if (value == null) return undefined;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : undefined;
};

const getBasis = (method: AllocationMethod, line: AllocationLine): number => {
  switch (method) {
    case 'units':
      return Math.max(0, line.qty);
    case 'weight':
      return ensurePositive(line.weight) ?? 0;
    case 'value':
      return ensurePositive(line.declaredValue) ?? 0;
    case 'rrp':
      return ensurePositive(line.rrp) ?? 0;
    case 'expected':
      return ensurePositive(line.expected) ?? 0;
    case 'manual':
      return ensurePositive(line.manualShare) ?? 0;
    default:
      return 0;
  }
};

export const allocateCost = (
  method: AllocationMethod,
  lines: AllocationLine[],
  totalCost: number,
): AllocationResult[] => {
  if (totalCost < 0) {
    throw new Error('Total cost must be non-negative');
  }
  if (!lines.length) {
    return [];
  }

  const bases = lines.map((line) => getBasis(method, line));
  const totalBasis = bases.reduce((sum, value) => sum + value, 0);

  if (totalBasis <= 0) {
    const evenShare = totalCost / lines.length;
    return lines.map((line) => ({ lineId: line.lineId, share: 1 / lines.length, allocated: roundCurrency(evenShare) }));
  }

  const allocations = lines.map((line, index) => {
    const share = bases[index] / totalBasis;
    const allocated = roundCurrency(totalCost * share);
    return { lineId: line.lineId, share, allocated };
  });

  const roundingDiff = roundCurrency(totalCost - allocations.reduce((sum, item) => sum + item.allocated, 0));
  if (roundingDiff !== 0) {
    const targetIndex = allocations.findIndex((item) => item.allocated > 0) ?? 0;
    if (targetIndex >= 0) {
      allocations[targetIndex] = {
        ...allocations[targetIndex],
        allocated: roundCurrency(allocations[targetIndex].allocated + roundingDiff),
      };
    }
  }

  return allocations;
};

const roundCurrency = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};
