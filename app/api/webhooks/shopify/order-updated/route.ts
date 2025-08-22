import { NextRequest, NextResponse } from 'next/server';
import { verifyShopifyHmac } from '@/lib/shopify';
import { storage } from '@/lib/storage';
import { BRMHOrdersAPI } from '@/lib/brmh-orders-api';

const brmhOrders = new BRMHOrdersAPI();

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();
    const hmac = request.headers.get('x-shopify-hmac-sha256');
    
    if (!verifyShopifyHmac(raw, hmac || undefined)) {
      return new NextResponse(null, { status: 401 });
    }
    
    const body = JSON.parse(raw);
    const shopifyOrderId = String(body?.id || body?.order?.id || "");
    const fulfillmentStatus = (body?.fulfillment_status || '').toString().toLowerCase();
    const canceled = !!body?.cancelled_at || (body?.cancel_reason ? true : false) || (body?.financial_status?.toLowerCase?.() === 'voided');

    // Map Shopify event to our status
    const newStatus = canceled ? 'Cancelled' : (fulfillmentStatus === 'fulfilled' ? 'Delivered' : undefined);

    if (newStatus) {
      // Update BRMH first
      try {
        const all = await brmhOrders.listOrders();
        const found = all.find((o: any) => String(o.shopifyOrderId) === shopifyOrderId);
        if (found) {
          await brmhOrders.updateOrder(String((found as any).id), { status: newStatus, updatedAt: new Date() } as any);
        }
      } catch (e) {
        console.warn('⚠️ BRMH update from order-updated webhook failed:', e);
      }
      // Update memory fallback
      try {
        const orders = await storage.getOrders();
        const target = orders.find(o => String(o.shopifyOrderId) === shopifyOrderId);
        if (target) await storage.updateOrder(target.id as any, { status: newStatus } as any);
      } catch {}
    }
    
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
