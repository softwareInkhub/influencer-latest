import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { BRMHStorage } from '@/lib/brmh-storage';
import { insertInfluencerSchema } from '@shared/schema';

// Initialize BRMH storage for influencers
const brmhStorage = new BRMHStorage();

export async function GET() {
  console.log('=== GET INFLUENCERS REQUEST ===');
  console.log('Fetching influencers from BRMH...');
  
  try {
    const isBRMHConnected = await brmhStorage.testConnection();
    console.log('BRMH Connection Status:', isBRMHConnected);
    
    const brmhInfluencers = await brmhStorage.getInfluencers();
    console.log(`✅ Returning ${brmhInfluencers.length} influencers from BRMH`);
    console.log('BRMH influencers:', JSON.stringify(brmhInfluencers, null, 2));
    
    // Also check what's in memory storage for comparison
    const memInfluencers = await storage.getInfluencers();
    console.log(`Memory storage has ${memInfluencers.length} influencers`);
    console.log('Memory influencers:', JSON.stringify(memInfluencers, null, 2));
    
    return NextResponse.json(brmhInfluencers);
  } catch (error) {
    console.error('❌ Error fetching influencers from BRMH:', error);
    console.error('Error Details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    // Fallback to in-memory storage so the UI still has data
    try {
      const fallback = await storage.getInfluencers();
      console.log(`⬇️ Fallback to memory: returning ${fallback.length} influencers`);
      return NextResponse.json(fallback);
    } catch (memErr) {
      console.error('❌ Fallback to memory failed:', memErr);
      return NextResponse.json({ error: "Failed to fetch influencers" }, { status: 500 });
    }
  }
}

export async function POST(request: NextRequest) {
  console.log('=== INFLUENCER CREATE REQUEST ===');
  
  try {
    const body = await request.json();
    console.log('Request Body:', JSON.stringify(body, null, 2));
    console.log('Timestamp:', new Date().toISOString());
    
    console.log('Validating request body with schema...');
    const validated = insertInfluencerSchema.parse(body);
    console.log('✅ Schema validation passed');
    console.log('Validated data:', JSON.stringify(validated, null, 2));
    
    // Prefer BRMH, fallback to memory storage
    let influencer: any;
    try {
      console.log('🔄 Creating influencer in BRMH...');
      influencer = await brmhStorage.createInfluencer(validated);
      console.log('✅ Successfully created influencer in BRMH');
    } catch (e) {
      console.warn('⚠️ BRMH create failed, falling back to memory storage');
      influencer = await storage.createInfluencer(validated as any);
    }
    console.log('Create influencer response:', JSON.stringify(influencer, null, 2));
    
    console.log('=== INFLUENCER CREATE RESPONSE ===');
    console.log('Status: 200 OK');
    console.log('Response Body:', JSON.stringify(influencer, null, 2));
    console.log('Timestamp:', new Date().toISOString());
    
    return NextResponse.json(influencer);
  } catch (error) {
    console.error('❌ Failed to create influencer:', error);
    console.error('Error Details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    console.log('=== INFLUENCER CREATE RESPONSE (ERROR) ===');
    console.log('Status: 500 Internal Server Error');
    console.log('Response Body:', JSON.stringify({ error: "Failed to create influencer" }, null, 2));
    console.log('Timestamp:', new Date().toISOString());
    
    return NextResponse.json({ error: "Failed to create influencer" }, { status: 500 });
  }
}
