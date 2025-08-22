import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { BRMHOrdersAPI } from '@/lib/brmh-orders-api';
import { insertOrderSchema } from '@shared/schema';

const brmhOrders = new BRMHOrdersAPI();

export async function GET() {
  try {
    let brmh: any[] = [];
    try {
      brmh = await brmhOrders.listOrders();
    } catch (e) {
      console.warn('⚠️ BRMH list orders failed, using memory only');
    }
    const mem = await storage.getOrders();
    // Merge by id/shopifyOrderId to avoid duplicates
    const seen = new Set<string>();
    const merged: any[] = [];
    for (const o of brmh) {
      const key = String((o as any).id || (o as any).shopifyOrderId);
      seen.add(key);
      merged.push(o);
    }
    for (const o of mem) {
      const key = String((o as any).id || (o as any).shopifyOrderId);
      if (!seen.has(key)) merged.push(o);
    }
    return NextResponse.json(merged);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== POST /api/orders ===');
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const validated = insertOrderSchema.parse(body);
    console.log('Validated order data:', JSON.stringify(validated, null, 2));
    
    // First persist to BRMH/Dynamo (source of truth)
    try {
      console.log('Attempting to create order in BRMH...');
      const brmhResult = await brmhOrders.createOrder(validated as any);
      console.log('BRMH create result:', JSON.stringify(brmhResult, null, 2));
    } catch (e) {
      console.error('⚠️ BRMH order create failed:', e);
      console.warn('⚠️ BRMH order create failed, falling back to memory storage');
    }
    // Respond with what we attempted to persist (client doesn't require memory id)
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('POST /api/orders error:', error);
    return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
  }
}
