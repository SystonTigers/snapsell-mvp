import { z } from 'zod';

/**
 * Request validation schemas
 * Use these to validate incoming request bodies
 */

// Pricing request
export const PriceRequestSchema = z.object({
  comps: z.array(
    z.object({
      price: z.number().positive().max(1000000),
      condition: z.string().optional(),
    })
  ).min(1).max(100),
  targetCondition: z.string().optional(),
  cogs: z.number().positive().max(1000000).optional(),
  targetMarginPct: z.number().min(0).max(1).optional(),
  rrp: z.number().positive().max(1000000).optional(),
  expected: z.number().positive().max(1000000).optional(),
  floorPctOverCogs: z.number().min(0).max(1).optional(),
  ceilPctOfRrp: z.number().min(0).max(2).optional(),
});

export type PriceRequest = z.infer<typeof PriceRequestSchema>;

// Listing publish request
export const PublishListingSchema = z.object({
  tenantId: z.string().min(1).max(100),
  channelId: z.string().min(1).max(100),
  itemId: z.string().min(1).max(100),
  payload: z.object({
    title: z.string().min(1).max(80),
    description: z.string().max(32000).optional(),
    price: z.number().positive().max(100000),
    quantity: z.number().int().positive().max(10000).optional(),
    currency: z.string().length(3).optional(),
    condition: z.string().optional(),
    images: z.array(z.string().url()).max(24).optional(),
  }),
  dryRun: z.boolean().optional(),
});

export type PublishListingRequest = z.infer<typeof PublishListingSchema>;

// Item ingest request
export const IngestItemSchema = z.object({
  tenantId: z.string().min(1).max(100),
  itemId: z.string().min(1).max(100),
  assets: z.array(
    z.object({
      type: z.enum(['image', 'document']),
      url: z.string().url(),
      metadata: z.record(z.unknown()).optional(),
    })
  ).max(50),
});

export type IngestItemRequest = z.infer<typeof IngestItemSchema>;

// Purchase create request
export const CreatePurchaseSchema = z.object({
  tenantId: z.string().min(1).max(100),
  supplierName: z.string().min(1).max(200),
  purchaseDate: z.string().datetime(),
  currency: z.string().length(3).default('GBP'),
  lines: z.array(
    z.object({
      itemId: z.string().min(1).max(100),
      quantity: z.number().int().positive().max(100000),
      unitCost: z.number().positive().max(1000000),
      description: z.string().max(500).optional(),
    })
  ).min(1).max(1000),
  shippingCost: z.number().min(0).max(100000).optional(),
  taxAmount: z.number().min(0).max(100000).optional(),
  notes: z.string().max(2000).optional(),
});

export type CreatePurchaseRequest = z.infer<typeof CreatePurchaseSchema>;

// Allocate purchase costs request
export const AllocatePurchaseSchema = z.object({
  purchaseId: z.string().min(1).max(100),
  allocationMethod: z.enum(['quantity', 'value', 'manual']).default('quantity'),
});

export type AllocatePurchaseRequest = z.infer<typeof AllocatePurchaseSchema>;

// Sync quantity request
export const SyncQuantitySchema = z.object({
  tenantId: z.string().min(1).max(100),
  channelId: z.string().min(1).max(100),
  itemId: z.string().min(1).max(100),
  quantity: z.number().int().min(0).max(100000),
});

export type SyncQuantityRequest = z.infer<typeof SyncQuantitySchema>;

// Generic validation helper
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}
