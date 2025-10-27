import { z } from 'zod';

export const PurchaseSchema = z.object({
  id: z.string().uuid(),
  supplier: z.string().optional(),
  ref: z.string().optional(),
  subtotal: z.number(),
  shipping_cost: z.number(),
  duties_cost: z.number(),
  other_cost: z.number(),
  currency: z.string().optional(),
  status: z.string(),
  recovery_mode: z.enum(['off', 'track_only', 'allocate_recovery']),
  recovery_target: z.number().nullable(),
  recovered_amount: z.number(),
  purchased_at: z.string()
});

export const PurchaseLineSchema = z.object({
  id: z.string().uuid(),
  purchase_id: z.string().uuid(),
  variant_id: z.string().uuid().nullable(),
  qty: z.number(),
  declared_unit_cost: z.number().nullable(),
  weight_per_unit: z.number().nullable(),
  declared_value: z.number().nullable()
});

export const InventoryLotSchema = z.object({
  id: z.string().uuid(),
  variant_id: z.string().uuid(),
  purchase_line_id: z.string().uuid().nullable(),
  qty_received: z.number(),
  qty_remaining: z.number(),
  unit_cogs: z.number(),
  received_at: z.string()
});

export const SaleSchema = z.object({
  id: z.string().uuid(),
  platform: z.string(),
  order_id: z.string().nullable(),
  variant_id: z.string().uuid(),
  qty: z.number(),
  sale_price: z.number(),
  fees: z.number(),
  shipping_cost: z.number(),
  other_costs: z.number(),
  cogs: z.number(),
  lot_id: z.string().uuid().nullable(),
  recovery_applied: z.number(),
  sold_at: z.string()
});

export const ChannelListingSchema = z.object({
  id: z.string().uuid(),
  platform: z.string(),
  variant_id: z.string().uuid(),
  platform_listing_id: z.string().nullable(),
  status: z.string(),
  last_synced_qty: z.number()
});

export type PurchaseRow = z.infer<typeof PurchaseSchema>;
export type PurchaseLineRow = z.infer<typeof PurchaseLineSchema>;
export type InventoryLotRow = z.infer<typeof InventoryLotSchema>;
export type SaleRow = z.infer<typeof SaleSchema>;
export type ChannelListingRow = z.infer<typeof ChannelListingSchema>;
