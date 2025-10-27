const percentile = (values: number[], ratio: number) => {
  if (!values.length) return 0;
  const index = (values.length - 1) * ratio;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) {
    return values[lower];
  }
  const weight = index - lower;
  return values[lower] * (1 - weight) + values[upper] * weight;
};

const median = (values: number[]) => percentile(values, 0.5);

export function priceFromComps(comps: number[]) {
  const cleaned = comps.filter((price) => Number.isFinite(price) && price > 0).sort((a, b) => a - b);
  if (!cleaned.length) {
    return { low: 0, mid: 0, high: 0 };
  }

  const q1 = percentile(cleaned, 0.25);
  const q3 = percentile(cleaned, 0.75);
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  const filtered = cleaned.filter((price) => price >= lowerFence && price <= upperFence);
  const sample = filtered.length ? filtered : cleaned;

  const low = sample[0];
  const high = sample[sample.length - 1];
  const mid = median(sample);

  return {
    low: Number(low.toFixed(2)),
    mid: Number(mid.toFixed(2)),
    high: Number(high.toFixed(2))
  };
}
