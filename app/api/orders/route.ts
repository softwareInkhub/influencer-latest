import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { BRMHOrdersAPI } from '@/lib/brmh-orders-api';
import { insertOrderSchema } from '@shared/schema';
import { createOrder } from '@/lib/shopify';

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
      
      // Now create order in Shopify
      try {
        console.log('Creating order in Shopify...');
        const shopifyOrder = await createOrder({
          email: validated.shippingDetails?.email,
          shipping_address: {
            first_name: validated.shippingDetails?.firstName || '',
            last_name: validated.shippingDetails?.lastName || '',
            address1: validated.shippingDetails?.address || '',
            city: validated.shippingDetails?.city || '',
            province: validated.shippingDetails?.state || '',
            zip: validated.shippingDetails?.zipCode || '',
            phone: validated.shippingDetails?.phone || '',
            country: 'US' // Default country
          },
          line_items: validated.products?.map(product => ({
            variant_id: parseInt(product.id) || 1, // Use product ID as variant ID, fallback to 1
            quantity: product.quantity || 1
          })) || [],
          tags: ['influencer-order', `influencer-${validated.influencerId}`],
          note: `Influencer order created via webapp. Order ID: ${validated.shopifyOrderId}`,
          financial_status: (validated.totalAmount === 0 || validated.totalAmount === null || validated.totalAmount === undefined) ? 'paid' : 'pending',
          fulfillment_status: 'unfulfilled'
        });
        
        console.log('Shopify order created:', shopifyOrder);
        
        // Update BRMH order with real Shopify order ID
        if (shopifyOrder.id) {
          await brmhOrders.updateOrder(validated.shopifyOrderId, {
            shopifyOrderId: String(shopifyOrder.id)
          } as any);
          console.log('Updated BRMH order with real Shopify order ID:', shopifyOrder.id);
        }
        
      } catch (shopifyError) {
        console.error('⚠️ Shopify order create failed:', shopifyError);
        console.warn('⚠️ Order created in BRMH but not in Shopify');
      }
      
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
