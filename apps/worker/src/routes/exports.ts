import { Router } from 'itty-router';

const router = Router({ base: '/export' });

const csvResponse = (csv: string): Response => {
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8'
    }
  });
};

router.get('/stock.csv', async () => {
  // TODO: pull data from vw_stock
  const csv = 'sku,variant_sku,title,on_hand\n';
  return csvResponse(csv);
});

router.get('/profit.csv', async () => {
  // TODO: pull from vw_profit_per_sale with optional date filters
  const csv = 'sold_at,platform,order_id,sku,qty,price,fees,cogs,profit\n';
  return csvResponse(csv);
});

router.get('/purchases.csv', async () => {
  // TODO: join purchases + vw_purchase_recovery
  const csv = 'purchased_at,supplier,ref,total_landed,recovery_mode,recovered_amount,remaining,status\n';
  return csvResponse(csv);
});

router.get('/valuation.csv', async () => {
  const csv = 'sku,variant_sku,title,qty_remaining,inventory_value\n';
  return csvResponse(csv);
});

router.get('/recovery.csv', async () => {
  const csv = 'purchase_id,supplier,target,recovered,remaining\n';
  return csvResponse(csv);
});

export default { handle: router.handle };
