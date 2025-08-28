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
    const shopifyOrderId = String(body?.fulfillment?.order_id || body?.order_id || "");
    
    // Update shipment data in BRMH first (source of truth), fallback to memory
    try {
      const all = await brmhOrders.listOrders();
      const found = all.find((o: any) => String(o.shopifyOrderId) === shopifyOrderId);
      if (found) {
        // Extract fulfillment data from Shopify webhook
        const fulfillment = body?.fulfillment;
        const trackingInfo = {
          status: fulfillment?.tracking_company ? "InTransit" : "Processing",
          trackingNumber: fulfillment?.tracking_number || null,
          carrier: fulfillment?.tracking_company || null,
          trackingUrl: fulfillment?.tracking_url || null,
          estimatedDelivery: fulfillment?.estimated_delivery_at ? new Date(fulfillment.estimated_delivery_at) : null,
          lastUpdated: new Date().toISOString(),
          deliveryHistory: fulfillment?.tracking_number ? [
            {
              status: "Shipped",
              timestamp: new Date().toISOString(),
              location: fulfillment?.tracking_company || "Unknown",
              description: `Package shipped via ${fulfillment?.tracking_company || 'carrier'}`
            }
          ] : []
        };

        await brmhOrders.updateOrder(String((found as any).id), { 
          status: "InTransit", 
          trackingInfo,
          updatedAt: new Date() 
        } as any);
        
        console.log('✅ Updated shipment data in BRMH for order:', shopifyOrderId);
      }
    } catch (e) {
      console.warn('⚠️ BRMH update from fulfillment webhook failed:', e);
    }
    
    try {
      const orders = await storage.getOrders();
      const target = orders.find(o => String(o.shopifyOrderId) === shopifyOrderId);
      if (target) await storage.updateOrder(target.id as any, { status: "InTransit" } as any);
    } catch {}
    
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
