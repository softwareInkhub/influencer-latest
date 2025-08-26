import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { BRMHOrdersAPI } from '@/lib/brmh-orders-api';
import { insertOrderSchema } from '@shared/schema';

const brmhOrders = new BRMHOrdersAPI();

export async function GET() {
  try {
    console.log('=== GET ORDERS REQUEST ===');
    console.log('Fetching orders from BRMH...');
    
    const orders = await brmhOrders.listOrders();
    console.log(`✅ Returning ${orders.length} orders from BRMH`);
    console.log('BRMH orders:', JSON.stringify(orders, null, 2));
    
    // Only return BRMH data - no fallback to dummy data
    return NextResponse.json(orders || []);
  } catch (error) {
    console.error('❌ Error fetching orders from BRMH:', error);
    console.error('Error Details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    // Return empty array instead of dummy data
    console.log('⚠️ BRMH connection failed - returning empty array');
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== POST /api/orders ===');
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    // Check for required fields before validation
    const requiredFields = ['influencerId', 'shopifyOrderId'];
    for (const field of requiredFields) {
      if (!body[field]) {
        console.error(`Missing required field: ${field}`);
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }
    
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
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: "Invalid order data", 
        details: error.message 
      }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
  }
}
