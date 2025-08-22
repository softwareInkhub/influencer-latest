import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const order = await storage.updateOrder(params.id, body);
    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
}
