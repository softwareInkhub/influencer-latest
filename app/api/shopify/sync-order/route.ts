import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { orderId, orderData } = await request.json();
    
    console.log('Syncing order to Shopify:', { orderId, orderData });
    
    // This endpoint will be used to sync local orders to Shopify
    // For now, it's a placeholder that can be implemented later
    // when the BRMH API is properly configured
    
    return NextResponse.json({
      success: true,
      message: 'Order sync endpoint created. Implementation pending BRMH API configuration.',
      orderId,
      orderData
    });
  } catch (error) {
    console.error('Shopify sync error:', error);
    return NextResponse.json({ 
      error: 'Sync failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
