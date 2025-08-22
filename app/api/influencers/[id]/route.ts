import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { BRMHStorage } from '@/lib/brmh-storage';

const brmhStorage = new BRMHStorage();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const item = await brmhStorage.getInfluencer(params.id);
    return NextResponse.json(item);
  } catch (error) {
    console.error('❌ Error fetching influencer by id:', error);
    return NextResponse.json({ error: "Influencer not found" }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    try {
      const influencer = await brmhStorage.updateInfluencer(params.id, body);
      return NextResponse.json(influencer);
    } catch (e) {
      console.warn('⚠️ BRMH update failed, falling back to memory storage');
      const updated = await storage.updateInfluencer(params.id, body);
      return NextResponse.json(updated);
    }
  } catch (error) {
    console.error('Error updating influencer:', error);
    return NextResponse.json({ error: "Influencer not found" }, { status: 404 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    try {
      const success = await brmhStorage.deleteInfluencer(params.id);
      if (success) return new NextResponse(null, { status: 204 });
    } catch (e) {
      console.warn('⚠️ BRMH delete failed, falling back to memory storage');
    }
    const memSuccess = await storage.deleteInfluencer(params.id);
    if (memSuccess) return new NextResponse(null, { status: 204 });
    return NextResponse.json({ error: "Influencer not found" }, { status: 404 });
  } catch (error) {
    console.error('Error deleting influencer:', error);
    return NextResponse.json({ error: "Failed to delete influencer" }, { status: 500 });
  }
}
