export type ConditionCode =
  | 'new'
  | 'like_new'
  | 'very_good'
  | 'good'
  | 'acceptable'
  | 'for_parts';

export interface ComparableSale {
  price: number;
  condition?: string;
}

export interface PricingSignals {
  comps: ComparableSale[];
  targetCondition?: string;
  cogs?: number;
  targetMarginPct?: number;
  rrp?: number;
  expected?: number;
  floorPctOverCogs?: number;
  ceilPctOfRrp?: number;
}

export interface PricingResult {
  suggested?: number;
  inputs: PricingSignals;
  condition: ConditionCode;
  compsUsed: number;
}

export const CONDITION_MULTIPLIER: Record<ConditionCode, number> = {
  new: 1,
  like_new: 0.95,
  very_good: 0.9,
  good: 0.8,
  acceptable: 0.65,
  for_parts: 0.4
};

export function normalizeCondition(input?: string | null): ConditionCode {
  if (!input) return 'good';
  const value = input.toLowerCase();
  if (/(brand\s*new|sealed|unused|bnib)/.test(value)) return 'new';
  if (/(like new|as new|open box)/.test(value)) return 'like_new';
  if (/(very good|excellent)/.test(value)) return 'very_good';
  if (/(good|light wear|minor wear)/.test(value)) return 'good';
  if (/(acceptable|heavy wear|marks|scratches)/.test(value)) return 'acceptable';
  if (/(spares|repairs|not working|fault|for parts)/.test(value)) return 'for_parts';
  return 'good';
}

export function median(values: number[]): number | undefined {
  const arr = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!arr.length) return undefined;
  const middle = Math.floor(arr.length / 2);
  return arr.length % 2 ? arr[middle] : (arr[middle - 1] + arr[middle]) / 2;
}

export function iqrTrim(values: number[], multiplier = 1.5): number[] {
  const arr = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (arr.length < 4) return arr;
  const q1 = arr[Math.floor(arr.length * 0.25)];
  const q3 = arr[Math.floor(arr.length * 0.75)];
  const iqr = q3 - q1;
  const low = q1 - multiplier * iqr;
  const high = q3 + multiplier * iqr;
  return arr.filter((value) => value >= low && value <= high);
}

function snapPrice(value: number): number {
  if (!Number.isFinite(value)) return value;
  const floored = Math.max(0, Math.round(value));
  if (floored <= 0) {
    return Number(Math.max(0, value).toFixed(2));
  }
  const snapped = floored - 0.01;
  return Number(snapped.toFixed(2));
}

export function suggestPrice(signals: PricingSignals): PricingResult {
  const condition = normalizeCondition(signals.targetCondition);
  const multiplierTarget = CONDITION_MULTIPLIER[condition];
  const adjustedComps = signals.comps.map((comp) => {
    const normalized = normalizeCondition(comp.condition);
    const compMultiplier = CONDITION_MULTIPLIER[normalized];
    return compMultiplier ? comp.price * (multiplierTarget / compMultiplier) : comp.price;
  });

  const trimmed = iqrTrim(adjustedComps);
  const compsMid = median(trimmed);

  const marginPrice =
    signals.cogs != null &&
    signals.targetMarginPct != null &&
    signals.targetMarginPct > 0 &&
    signals.targetMarginPct < 0.95
      ? signals.cogs / (1 - signals.targetMarginPct)
      : undefined;

  const candidates = [compsMid, marginPrice, signals.expected, signals.rrp]
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  let suggested = median(candidates ?? []);
  if (suggested == null) {
    return { suggested: undefined, inputs: signals, condition, compsUsed: trimmed.length };
  }

  if (signals.cogs != null) {
    const floorMultiplier = signals.floorPctOverCogs ?? 0.07;
    const floor = signals.cogs * (1 + floorMultiplier);
    if (suggested < floor) {
      suggested = floor;
    }
  }

  if (signals.rrp != null) {
    const ceilingMultiplier = signals.ceilPctOfRrp ?? 1;
    const ceiling = signals.rrp * ceilingMultiplier;
    if (suggested > ceiling) {
      suggested = ceiling;
    }
  }

  return {
    suggested: snapPrice(suggested),
    inputs: signals,
    condition,
    compsUsed: trimmed.length
  };
}
