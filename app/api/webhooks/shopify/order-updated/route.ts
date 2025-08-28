import { NextRequest, NextResponse } from 'next/server';
import { verifyShopifyHmac } from '@/lib/shopify';
import { storage } from '@/lib/storage';
import { BRMHOrdersAPI } from '@/lib/brmh-orders-api';

const brmhOrders = new BRMHOrdersAPI();

export async function POST(request: NextRequest) {
  try {
    console.log('=== SHOPIFY ORDER UPDATED WEBHOOK RECEIVED ===');
    const raw = await request.text();
    const hmac = request.headers.get('x-shopify-hmac-sha256');
    
    console.log('Webhook body:', raw);
    console.log('HMAC header:', hmac);
    
    if (!verifyShopifyHmac(raw, hmac || undefined)) {
      console.log('⚠️ HMAC verification failed');
      return new NextResponse(null, { status: 401 });
    }
    
    const body = JSON.parse(raw);
    const shopifyOrderId = String(body?.id || body?.order?.id || "");
    const fulfillmentStatus = (body?.fulfillment_status || '').toString().toLowerCase();
    const canceled = !!body?.cancelled_at || (body?.cancel_reason ? true : false) || (body?.financial_status?.toLowerCase?.() === 'voided');
    
    console.log('Shopify Order ID:', shopifyOrderId);
    console.log('Fulfillment Status:', fulfillmentStatus);
    console.log('Canceled:', canceled);
    console.log('Cancelled at:', body?.cancelled_at);
    console.log('Cancel reason:', body?.cancel_reason);
    console.log('Financial status:', body?.financial_status);

    // Map Shopify event to our status
    const newStatus = canceled ? 'Cancelled' : (fulfillmentStatus === 'fulfilled' ? 'Delivered' : undefined);

    if (newStatus) {
      console.log('✅ Updating order status to:', newStatus);
      // Update BRMH first
      try {
        const all = await brmhOrders.listOrders();
        const found = all.find((o: any) => String(o.shopifyOrderId) === shopifyOrderId);
        if (found) {
          console.log('✅ Found order in BRMH, updating status...');
          await brmhOrders.updateOrder(String((found as any).id), { status: newStatus, updatedAt: new Date() } as any);
          console.log('✅ Successfully updated order status in BRMH');
        } else {
          console.log('❌ Order not found in BRMH:', shopifyOrderId);
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
