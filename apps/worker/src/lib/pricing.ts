export type ConditionCode = 'new'|'like_new'|'very_good'|'good'|'acceptable'|'for_parts';

export const CONDITION_MULTIPLIER: Record<ConditionCode, number> = {
  new: 1.00,
  like_new: 0.95,
  very_good: 0.90,
  good: 0.80,
  acceptable: 0.65,
  for_parts: 0.40,
};

// Map free-text → normalized condition
export function normalizeCondition(input?: string): ConditionCode {
  const s = (input || '').toLowerCase();
  if (/(brand\s*new|sealed|unused|bnib)/.test(s)) return 'new';
  if (/(like new|as new|open box)/.test(s)) return 'like_new';
  if (/(very good|excellent)/.test(s)) return 'very_good';
  if (/(good|light wear|minor wear)/.test(s)) return 'good';
  if (/(acceptable|heavy wear|marks|scratches)/.test(s)) return 'acceptable';
  if (/(spares|repairs|not working|fault|for parts)/.test(s)) return 'for_parts';
  return 'good';
}

export function median(nums: number[]): number | undefined {
  const arr = nums.filter(x => Number.isFinite(x)).sort((a,b)=>a-b);
  if (!arr.length) return undefined;
  const m = Math.floor(arr.length/2);
  return arr.length % 2 ? arr[m] : (arr[m-1] + arr[m]) / 2;
}

export function iqrTrim(nums: number[], k = 1.5): number[] {
  const arr = nums.filter(x => Number.isFinite(x)).sort((a,b)=>a-b);
  if (arr.length < 4) return arr;
  const q1 = arr[Math.floor(arr.length*0.25)];
  const q3 = arr[Math.floor(arr.length*0.75)];
  const iqr = q3 - q1;
  const lo = q1 - k*iqr;
  const hi = q3 + k*iqr;
  return arr.filter(x => x >= lo && x <= hi);
}

export function suggestPrice(opts: {
  comps: { price: number; condition?: ConditionCode }[];
  targetCondition?: ConditionCode;   // normalized input
  cogs?: number;                     // unit cost (COGS)
  targetMarginPct?: number;          // 0.35 = 35%
  rrp?: number;
  expected?: number;                 // expected resale (owner signal)
  floorPctOverCogs?: number;         // e.g. 0.10 => price >= COGS * 1.10
  ceilPctOfRrp?: number;             // e.g. 0.95 => price <= RRP * 0.95
}) {
  const {
    comps, targetCondition='good', cogs, targetMarginPct,
    rrp, expected, floorPctOverCogs=0.07, ceilPctOfRrp=1.00
  } = opts;

  // 1) Condition-weight comps: prefer same condition; otherwise scale by multipliers to targetCondition
  const multTarget = CONDITION_MULTIPLIER[targetCondition];
  const adjusted = comps
    .map(c => {
      const m = CONDITION_MULTIPLIER[c.condition ?? 'good'];
      // bring comp to "targetCondition" space
      const scaled = c.price * (multTarget / m);
      return scaled;
    });

  // 2) Robust central tendency (IQR-trimmed median)
  const trimmed = iqrTrim(adjusted);
  const compsMid = median(trimmed);

  // 3) Other signals
  const marginBased = (cogs != null && targetMarginPct != null && targetMarginPct < 0.95)
    ? +(cogs / (1 - targetMarginPct)) : undefined;

  const candidates = [compsMid, marginBased, opts.expected, rrp]
    .filter((x): x is number => typeof x === 'number' && Number.isFinite(x));

  if (!candidates.length) return undefined;

  // 4) Combine signals by median (stable), then apply floors/ceilings
  let p = median(candidates)!;

  // Floor: at least COGS * (1 + floorPctOverCogs)
  if (cogs != null) {
    const floor = cogs * (1 + floorPctOverCogs);
    if (p < floor) p = floor;
  }

  // Ceiling: cap vs RRP if provided
  if (rrp != null) {
    const ceil = rrp * ceilPctOfRrp;
    if (p > ceil) p = ceil;
  }

  // 5) Snap to sensible endings (e.g., .99)
  const snapped = Math.max(0, Math.round(p)) - 0.01; // 19.99, 29.99…
  return +snapped.toFixed(2);
}
