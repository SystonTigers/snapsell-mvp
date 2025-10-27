export interface Product {
  id: string;
  ownerId: string;
  sku: string;
  title: string;
  brand?: string;
  category?: string;
  rrp?: number;
  targetMarginPct?: number;
}

export interface Variant {
  id: string;
  productId: string;
  variantSku: string;
  attrs?: Record<string, unknown>;
  expectedResale?: number;
  autoRelistFacebook?: boolean;
  autoRelistVinted?: boolean;
  autoRelistGumtree?: boolean;
}

export interface StockSnapshot {
  variantId: string;
  sku: string;
  variantSku: string;
  title: string;
  onHand: number;
}

export interface Purchase {
  id: string;
  supplier?: string;
  ref?: string;
  subtotal: number;
  shippingCost: number;
  dutiesCost: number;
  otherCost: number;
  currency?: string;
  status: string;
  recoveryMode: 'off' | 'track_only' | 'allocate_recovery';
  recoveryTarget?: number;
  recoveredAmount: number;
  purchasedAt: string;
}

export interface PurchaseLine {
  id: string;
  purchaseId: string;
  variantId?: string;
  qty: number;
  declaredUnitCost?: number;
  weightPerUnit?: number;
  declaredValue?: number;
}

export interface InventoryLot {
  id: string;
  variantId: string;
  purchaseLineId?: string;
  qtyReceived: number;
  qtyRemaining: number;
  unitCogs: number;
  receivedAt: string;
}

export interface Sale {
  id: string;
  platform: string;
  orderId?: string;
  variantId: string;
  qty: number;
  salePrice: number;
  fees: number;
  shippingCost: number;
  otherCosts: number;
  cogs: number;
  lotId?: string;
  recoveryApplied: number;
  soldAt: string;
}

export interface ChannelListing {
  id: string;
  platform: string;
  variantId: string;
  platformListingId?: string;
  status: string;
  lastSyncedQty: number;
}

export interface RelistTask {
  id: string;
  platform: string;
  variantId: string;
  status: string;
  attempts: number;
}
