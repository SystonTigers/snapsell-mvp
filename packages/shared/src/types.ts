export type Item = {
  id: string; owner_id: string;
  title?: string; brand?: string; model?: string; category?: string;
  condition?: string; color?: string; size?: string; description?: string;
  price_low?: number; price_mid?: number; price_high?: number; price_chosen?: number;
  status: 'draft'|'ready'|'listed'|'sold';
};
