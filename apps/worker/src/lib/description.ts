type DescInput = {
  title?: string;
  brand?: string;
  model?: string;
  category?: string;
  condition?: string;        // free text, normalize if needed
  keyFeatures?: string[];    // bullets like size, color, edition, material
  knownFlaws?: string[];     // “small scuff on left side”, etc.
  included?: string[];       // “original box”, “charging cable”
  notIncluded?: string[];    // “batteries not included”
  care?: string[];           // care/washing/handling notes (apparel etc)
  measurements?: string[];   // “pit to pit 21””, “inseam 30””
  notes?: string;            // seller quick notes
  shippingNote?: string;     // “ships next working day”
  returnsNote?: string;      // “14-day returns if unused”
  crossListNotice?: boolean; // include cross-listing warning
};

function bullet(items?: string[], label?: string) {
  if (!items || !items.length) return '';
  const body = items.map(x => `• ${x}`).join('\n');
  return label ? `${label}\n${body}\n` : `${body}\n`;
}

export function writeListingDescription(i: DescInput) {
  const lines: string[] = [];
  // 1) One-liner opener (plain, no hype)
  const bits = [i.brand, i.model, i.category].filter(Boolean);
  if (bits.length) lines.push(`${bits.join(' · ')}`);

  // 2) Condition line (concise, human)
  if (i.condition) lines.push(`Condition: ${i.condition[0].toUpperCase()}${i.condition.slice(1)}`);

  // 3) Features / specifics
  if (i.keyFeatures?.length) lines.push(bullet(i.keyFeatures, 'Details:').trim());

  // 4) Measurements (if apparel) and care
  if (i.measurements?.length) lines.push(bullet(i.measurements, 'Measurements:').trim());
  if (i.care?.length) lines.push(bullet(i.care, 'Care:').trim());

  // 5) What’s included / not included
  if (i.included?.length) lines.push(bullet(i.included, 'Included:').trim());
  if (i.notIncluded?.length) lines.push(bullet(i.notIncluded, 'Not included:').trim());

  // 6) Honest flaws (clear, non-dramatic)
  if (i.knownFlaws?.length) lines.push(bullet(i.knownFlaws, 'Notes:').trim());

  // 7) Seller notes
  if (i.notes) lines.push(i.notes.trim());

  // 8) Shipping/returns
  if (i.shippingNote) lines.push(i.shippingNote.trim());
  if (i.returnsNote) lines.push(i.returnsNote.trim());

  // 9) Cross-list notice
  if (i.crossListNotice) lines.push('Listed on multiple marketplaces — availability may change. If it sells elsewhere, this listing may end.');

  // Join with blank lines between sections
  return lines.filter(Boolean).join('\n\n').trim();
}
