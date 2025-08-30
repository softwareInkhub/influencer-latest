import { NextRequest, NextResponse } from 'next/server';
import { BRMHOrdersAPI } from '@/lib/brmh-orders-api';

const brmhOrders = new BRMHOrdersAPI();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Fetch order from BRMH using getOrder
    let order = null;
    try {
      order = await brmhOrders.getOrder(params.id);
    } catch (brmhError) {
      console.error('❌ BRMH fetch failed:', brmhError);
      // Return empty shipment data if order not found
      return NextResponse.json({
        success: true,
        shipment: {
          status: 'Order Not Found',
          trackingNumber: null,
          carrier: null,
          trackingUrl: null,
          estimatedDelivery: null,
          deliveryHistory: [],
          lastUpdated: new Date().toISOString(),
          orderStatus: 'Unknown'
        }
      });
    }
    
    // Build shipment data from real order data
    const trackingInfo = order?.trackingInfo || {};
    const isFulfilled = order?.status === 'InTransit' || order?.status === 'Delivered';
    
    const shipmentData = {
      status: order?.status || 'Created',
      trackingNumber: isFulfilled ? (trackingInfo.trackingNumber || null) : null,
      carrier: isFulfilled ? (trackingInfo.carrier || null) : null,
      trackingUrl: isFulfilled ? (trackingInfo.trackingUrl || null) : null,
      estimatedDelivery: isFulfilled ? (trackingInfo.estimatedDelivery || null) : null,
      deliveryHistory: trackingInfo.deliveryHistory || [],
      lastUpdated: order?.updatedAt?.toISOString() || new Date().toISOString(),
      orderStatus: order?.status || 'Created'
    };



    return NextResponse.json({
      success: true,
      shipment: shipmentData
    });

  } catch (error) {
    console.error('Error in shipment API:', error);
    
    // Return error state
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch shipment data',
      shipment: {
        status: 'Error',
        trackingNumber: null,
        carrier: null,
        trackingUrl: null,
        estimatedDelivery: null,
        deliveryHistory: [],
        lastUpdated: new Date().toISOString(),
        orderStatus: 'Error'
      }
    });
  }
}
