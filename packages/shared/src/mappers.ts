import type {
  ChannelListing,
  InventoryLot,
  Purchase,
  PurchaseLine,
  Sale
} from './types';
import type {
  ChannelListingRow,
  InventoryLotRow,
  PurchaseLineRow,
  PurchaseRow,
  SaleRow
} from './schemas';

export function mapPurchase(row: PurchaseRow): Purchase {
  return {
    id: row.id,
    supplier: row.supplier ?? undefined,
    ref: row.ref ?? undefined,
    subtotal: row.subtotal,
    shippingCost: row.shipping_cost,
    dutiesCost: row.duties_cost,
    otherCost: row.other_cost,
    currency: row.currency ?? undefined,
    status: row.status,
    recoveryMode: row.recovery_mode,
    recoveryTarget: row.recovery_target ?? undefined,
    recoveredAmount: row.recovered_amount,
    purchasedAt: row.purchased_at
  };
}

export function mapPurchaseLine(row: PurchaseLineRow): PurchaseLine {
  return {
    id: row.id,
    purchaseId: row.purchase_id,
    variantId: row.variant_id ?? undefined,
    qty: row.qty,
    declaredUnitCost: row.declared_unit_cost ?? undefined,
    weightPerUnit: row.weight_per_unit ?? undefined,
    declaredValue: row.declared_value ?? undefined
  };
}

export function mapInventoryLot(row: InventoryLotRow): InventoryLot {
  return {
    id: row.id,
    variantId: row.variant_id,
    purchaseLineId: row.purchase_line_id ?? undefined,
    qtyReceived: row.qty_received,
    qtyRemaining: row.qty_remaining,
    unitCogs: row.unit_cogs,
    receivedAt: row.received_at
  };
}

export function mapSale(row: SaleRow): Sale {
  return {
    id: row.id,
    platform: row.platform,
    orderId: row.order_id ?? undefined,
    variantId: row.variant_id,
    qty: row.qty,
    salePrice: row.sale_price,
    fees: row.fees,
    shippingCost: row.shipping_cost,
    otherCosts: row.other_costs,
    cogs: row.cogs,
    lotId: row.lot_id ?? undefined,
    recoveryApplied: row.recovery_applied,
    soldAt: row.sold_at
  };
}

export function mapChannelListing(row: ChannelListingRow): ChannelListing {
  return {
    id: row.id,
    platform: row.platform,
    variantId: row.variant_id,
    platformListingId: row.platform_listing_id ?? undefined,
    status: row.status,
    lastSyncedQty: row.last_synced_qty
  };
}
