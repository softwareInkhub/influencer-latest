import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { insertContentSchema } from '@shared/schema';

export async function GET() {
  try {
    const content = await storage.getContent();
    return NextResponse.json(content);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = insertContentSchema.parse(body);
    const content = await storage.createContent(validated);
    return NextResponse.json(content);
  } catch (error) {
    return NextResponse.json({ error: "Invalid content data" }, { status: 400 });
  }
}
