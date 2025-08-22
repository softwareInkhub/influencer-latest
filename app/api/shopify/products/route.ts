import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const vendor = searchParams.get('vendor');
    const page_info = searchParams.get('page_info');
    const limit = searchParams.get('limit');
    
    const requestedLimit = limit ? Number(limit) : 50;
    
    // Try using BRMH crud endpoint like the other working APIs
    const brmhUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.brmh.io';
    const tableName = 'shopify-inkhub-get-products';
    
    console.log('=== TRYING BRMH CRUD APPROACH ===');
    console.log('BRMH Request URL:', `${brmhUrl}/crud?tableName=${tableName}&pagination=true&itemPerPage=${requestedLimit}`);
    
    const response = await fetch(`${brmhUrl}/crud?tableName=${tableName}&pagination=true&itemPerPage=${requestedLimit}`);
    
    console.log('BRMH CRUD Response Status:', response.status);
    
    if (response.ok) {
      const responseData = await response.json();
      console.log('BRMH CRUD Success Response:', JSON.stringify(responseData, null, 2));
      
      if (responseData.success && responseData.items) {
        // Transform products from BRMH table format
        const products = responseData.items.map((item: any) => ({
          id: item.id,
          title: item.title || item.name,
          thumbnail: item.image?.src || item.thumbnail?.src || item.thumbnail,
          variants: item.variants || [{
            variantId: item.id,
            title: item.title || item.name,
            price: item.price || "0.00",
            compareAtPrice: item.compareAtPrice || item.compare_at_price,
            stock: item.stock || item.inventory || 50,
            image: item.image?.src || item.thumbnail?.src || item.thumbnail
          }],
          totalStock: item.stock || item.inventory || 50
        }));
        
        // Apply search filter if provided
        let filteredProducts = products;
        if (q) {
          filteredProducts = products.filter(p => 
            p.title.toLowerCase().includes(q.toLowerCase())
          );
        }
        
        return NextResponse.json({ 
          products: filteredProducts, 
          nextPageInfo: null, 
          prevPageInfo: null 
        });
      }
    }
    
    // If CRUD approach fails, try a different approach - maybe we can use a different table name
    console.log('CRUD approach failed, trying alternative table names...');
    
    const alternativeTableNames = [
      'brmh-products',
      'shopify-products', 
      'products',
      'brmh-shopify-inventory'
    ];
    
    for (const altTableName of alternativeTableNames) {
      console.log(`Trying table: ${altTableName}`);
      
      const altResponse = await fetch(`${brmhUrl}/crud?tableName=${altTableName}&pagination=true&itemPerPage=${requestedLimit}`);
      
      if (altResponse.ok) {
        const altData = await altResponse.json();
        console.log(`Success with table ${altTableName}:`, JSON.stringify(altData, null, 2));
        
        if (altData.success && altData.items) {
          const products = altData.items.map((item: any) => ({
            id: item.id,
            title: item.title || item.name,
            thumbnail: item.image?.src || item.thumbnail?.src || item.thumbnail,
            variants: item.variants || [{
              variantId: item.id,
              title: item.title || item.name,
              price: item.price || "0.00",
              compareAtPrice: item.compareAtPrice || item.compare_at_price,
              stock: item.stock || item.inventory || 50,
              image: item.image?.src || item.thumbnail?.src || item.thumbnail
            }],
            totalStock: item.stock || item.inventory || 50
          }));
          
          let filteredProducts = products;
          if (q) {
            filteredProducts = products.filter(p => 
              p.title.toLowerCase().includes(q.toLowerCase())
            );
          }
          
          return NextResponse.json({ 
            products: filteredProducts, 
            nextPageInfo: null, 
            prevPageInfo: null 
          });
        }
      }
    }
    
    // If all CRUD approaches fail, let's try one more approach - maybe we can use the execute endpoint with a different method
    console.log('All CRUD approaches failed, trying execute with different method structure...');
    
    // Try using the execute endpoint but with a completely different request structure
    const executePayload = {
      executeType: "namespace",
      namespaceId: "b429f105-4b19-4ce1-97dd-984e98c72f3c",
      accountId: "f60444cb-203e-45a4-8bc9-c6c4cf4a3ed2",
      methodId: "270b2e8d-b480-48f4-863a-4193db3b52a2",
      requestBody: {
        // Try a completely different structure
        request: {
          type: "products",
          action: "list",
          params: {
            status: 'active',
            published_status: 'published',
            limit: requestedLimit,
            ...(q && { title: q }),
            ...(vendor && { vendor }),
            ...(page_info && { page_info })
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
      const products = shopifyResponse?.products || [];
      
      // Transform products to match expected format with proper image handling
      const seen = new Set<number | string>();
      const payload = products.filter((p: any) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      }).map((p: any) => {
        // Get the main product image from image.src (your data structure)
        let mainImage = null;
        if (p.image && p.image.src) {
          // Use the image.src from your data structure
          mainImage = p.image.src;
        } else if (p.images && p.images.length > 0) {
          // Fallback to images array if image field is not available
          mainImage = p.images[0].src;
        }
        
        // Create thumbnail URL with proper sizing
        const thumbnail = mainImage ? `${mainImage}&width=112&height=112&crop=center` : null;
        
        const variants = (p.variants || []).map((v: any) => {
          // Get variant-specific image if available
          let variantImage = mainImage; // Default to main product image
          
          if (v.image_id && p.images) {
            // Find the specific image for this variant
            const variantSpecificImage = p.images.find((img: any) => img.id === v.image_id);
            if (variantSpecificImage) {
              variantImage = variantSpecificImage.src;
            }
          }
          
          return {
            variantId: v.id,
            title: v.title,
            price: v.price,
            compareAtPrice: v.compare_at_price,
            stock: v.inventory_quantity || 50, // Use actual inventory quantity
            image: variantImage,
          };
        });
        
        const totalStock = variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
        
        return {
          id: p.id,
          title: p.title,
          thumbnail: thumbnail,
          variants,
          totalStock,
        };
      });
      
      return NextResponse.json({ products: payload, nextPageInfo: null, prevPageInfo: null });
    }
    
    // All approaches failed
    const errorText = await executeResponse.text();
    console.error('All approaches failed:', errorText);
    
    return NextResponse.json({ 
      error: 'Unable to fetch products via any BRMH method',
      details: 'Tried CRUD endpoints, alternative table names, and execute endpoint with different structures. All failed.',
      suggestion: 'Please check BRMH configuration or provide correct method/table for product fetching.',
      attempts: [
        'Tried BRMH CRUD endpoint with shopify-inkhub-get-products table',
        'Tried alternative table names (brmh-products, shopify-products, products, brmh-shopify-inventory)',
        'Tried execute endpoint with different request structure'
      ]
    }, { status: 500 });
    
  } catch (err: any) {
    console.error('Products API error:', err);
    return NextResponse.json({ 
      error: 'Failed to fetch products',
      details: err?.message || err?.toString()
    }, { status: 500 });
  }
}
