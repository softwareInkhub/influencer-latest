import { NextRequest, NextResponse } from 'next/server';
import { BRMHStorage } from '@/lib/brmh-storage';

const brmhStorage = new BRMHStorage();

export async function GET() {
  try {
    const isConnected = await brmhStorage.testConnection();
    return NextResponse.json({ 
      connected: isConnected, 
      message: isConnected ? 'BRMH is connected' : 'BRMH is not connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      connected: false, 
      error: "Failed to test BRMH connection",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
