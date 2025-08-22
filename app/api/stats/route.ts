import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export async function GET() {
  try {
    const influencers = await storage.getInfluencers();
    const orders = await storage.getOrders();
    const content = await storage.getContent();

    const stats = {
      totalInfluencers: influencers.length,
      activeOrders: orders.filter(o => o.status !== "Completed").length,
      pendingContent: content.filter(c => c.status === "PendingReview").length,
      completionRate: "87%"
    };

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
