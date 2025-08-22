import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const content = await storage.updateContent(params.id, body);
    return NextResponse.json(content);
  } catch (error) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }
}
