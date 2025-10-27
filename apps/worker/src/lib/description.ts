export interface DescriptionInput {
  title?: string;
  brand?: string;
  model?: string;
  category?: string;
  condition?: string;
  keyFeatures?: string[];
  measurements?: string[];
  care?: string[];
  included?: string[];
  notIncluded?: string[];
  knownFlaws?: string[];
  notes?: string;
  shippingNote?: string;
  returnsNote?: string;
  crossListNotice?: boolean;
}

function section(title: string, body?: string | string[]): string | undefined {
  if (!body || (Array.isArray(body) && !body.length)) return undefined;
  const content = Array.isArray(body) ? body.map((item) => `• ${item}`).join('\n') : body.trim();
  return `${title}\n${content}`;
}

export function buildHumanDescription(input: DescriptionInput): string {
  const blocks: Array<string | undefined> = [];
  const headerBits = [input.brand, input.model, input.category].filter(Boolean).join(' · ');
  if (headerBits) {
    blocks.push(headerBits);
  }

  if (input.condition) {
    blocks.push(section('Condition', input.condition));
  }

  blocks.push(section('Details', input.keyFeatures));
  blocks.push(section('Measurements', input.measurements));
  blocks.push(section('Care', input.care));
  blocks.push(section('Included', input.included));
  blocks.push(section('Not included', input.notIncluded));
  blocks.push(section('Notes / Flaws', input.knownFlaws));

  if (input.notes) {
    blocks.push(input.notes.trim());
  }

  const shippingBits = [input.shippingNote, input.returnsNote]
    .filter(Boolean)
    .map((value) => value!.trim());
  if (shippingBits.length) {
    blocks.push(section('Shipping / Returns', shippingBits.join('\n')));
  }

  if (input.crossListNotice !== false) {
    blocks.push(
      'Listed on multiple marketplaces — availability may change; this listing may end if sold elsewhere.'
    );
  }

  return blocks.filter(Boolean).join('\n\n');
}
