import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { products, affiliateId } = await req.json();
    
    if (!Array.isArray(products) || !affiliateId) {
      return Response.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const validatedProducts = [];
    const failedProducts = [];

    for (const product of products) {
      try {
        const affiliateUrl = `https://amazon.co.uk/s?k=${encodeURIComponent(product.product_name)}&tag=${affiliateId}`;
        
        // Attempt to fetch the product page to verify it's accessible
        const response = await fetch(affiliateUrl, {
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Base44/1.0)'
          }
        });

        if (response.ok || response.status === 403) {
          // 403 is OK - it means the page exists but is blocking the request
          validatedProducts.push({
            ...product,
            affiliateUrl,
            validated: true
          });
        } else {
          failedProducts.push({
            product_name: product.product_name,
            reason: `HTTP ${response.status}`,
            url: affiliateUrl
          });
        }
      } catch (error) {
        failedProducts.push({
          product_name: product.product_name,
          reason: error.message,
          url: affiliateUrl
        });
      }
    }

    return Response.json({
      validatedProducts,
      failedProducts,
      successRate: validatedProducts.length / products.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});