import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const vendor = searchParams.get('vendor');
    
    // Try using BRMH crud endpoint like the other working APIs
    const brmhUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.brmh.io';
    
    console.log('=== TRYING BRMH CRUD APPROACH FOR COUNT ===');
    
    // Try different table names for products
    const tableNames = [
      'brmh-shopify-products',
      'brmh-products',
      'shopify-products', 
      'products',
      'brmh-shopify-inventory'
    ];
    
    for (const tableName of tableNames) {
      console.log(`Trying table: ${tableName}`);
      
      const response = await fetch(`${brmhUrl}/crud?tableName=${tableName}&pagination=true&itemPerPage=1000`);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log(`Success with table ${tableName}:`, JSON.stringify(responseData, null, 2));
        
        if (responseData.success && responseData.items) {
          let products = responseData.items;
          
          // Apply search filter if provided
          if (q) {
            products = products.filter((item: any) => 
              (item.title || item.name || '').toLowerCase().includes(q.toLowerCase())
            );
          }
          
          const count = products.length;
          console.log(`Found ${count} products in table ${tableName}`);
          
          return NextResponse.json({ count });
        }
      }
    }
    
    // If all CRUD approaches fail, try the execute endpoint with a different structure
    console.log('All CRUD approaches failed, trying execute endpoint...');
    
    const executePayload = {
      executeType: "namespace",
      namespaceId: "b429f105-4b19-4ce1-97dd-984e98c72f3c",
      accountId: "f60444cb-203e-45a4-8bc9-c6c4cf4a3ed2",
      methodId: "270b2e8d-b480-48f4-863a-4193db3b52a2",
      requestBody: {
        request: {
          type: "products",
          action: "count",
          params: {
            status: 'active',
            published_status: 'published',
            ...(q && { title: q }),
            ...(vendor && { vendor })
          }
        }
      },
      save: false
    };
    
    const executeResponse = await fetch(`${brmhUrl}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(executePayload)
    });
    
    if (executeResponse.ok) {
      const executeData = await executeResponse.json();
      console.log('Execute approach success:', JSON.stringify(executeData, null, 2));
      
      const shopifyResponse = executeData?.result?.data || executeData?.data;
      const count = shopifyResponse?.count || 0;
      
      return NextResponse.json({ count });
    }
    
    // All approaches failed
    const errorText = await executeResponse.text();
    console.error('All count approaches failed:', errorText);
    
    return NextResponse.json({ 
      error: 'Unable to fetch product count via any BRMH method',
      details: 'Tried CRUD endpoints with multiple table names and execute endpoint. All failed.',
      suggestion: 'Please check BRMH configuration or provide correct method/table for product fetching.',
      attempts: [
        'Tried BRMH CRUD endpoint with multiple table names',
        'Tried execute endpoint with different request structure'
      ]
    }, { status: 500 });

  } catch (err: any) {
    console.error('Products count API error:', err);
    return NextResponse.json({ 
      error: 'Failed to fetch products count',
      details: err?.message || err?.toString()
    }, { status: 500 });
  }
}
