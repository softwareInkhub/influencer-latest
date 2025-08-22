import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { insertMessageTemplateSchema } from '@shared/schema';

export async function GET() {
  try {
    const templates = await storage.getMessageTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch message templates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = insertMessageTemplateSchema.parse(body);
    const template = await storage.createMessageTemplate(validated);
    return NextResponse.json(template);
  } catch (error) {
    return NextResponse.json({ error: "Invalid template data" }, { status: 400 });
  }
}
