import crypto from "crypto";

function getShopifyConfig() {
  const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || "";
  const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";
  const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || "2024-10";
  const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET || "";

  // Debug logging
  console.log("Shopify Environment Variables:");
  console.log("SHOPIFY_STORE_DOMAIN:", SHOPIFY_STORE_DOMAIN);
  console.log("SHOPIFY_ADMIN_TOKEN:", SHOPIFY_ADMIN_TOKEN ? "SET" : "NOT SET");
  console.log("SHOPIFY_API_VERSION:", SHOPIFY_API_VERSION);

  return { SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_TOKEN, SHOPIFY_API_VERSION, SHOPIFY_WEBHOOK_SECRET };
}

function getBaseUrl(): string {
  const { SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_TOKEN, SHOPIFY_API_VERSION } = getShopifyConfig();
  if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ADMIN_TOKEN) {
    throw new Error("Shopify environment variables are not configured");
  }
  return `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}`;
}

async function shopifyFetch(path: string, init?: RequestInit, retry = 0): Promise<Response> {
  const { SHOPIFY_ADMIN_TOKEN } = getShopifyConfig();
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN,
      ...(init?.headers || {}),
    },
  });

  // Backoff once between 700–1200ms on rate limit, as required
  if (res.status === 429 && retry < 1) {
    const delay = 700 + Math.floor(Math.random() * 500);
    await new Promise(r => setTimeout(r, delay));
    return shopifyFetch(path, init, retry + 1);
  }
  return res;
}

export async function listProducts(options: {
  q?: string;
  vendor?: string;
  page_info?: string;
  limit?: number;
}): Promise<{ products: any[]; nextPageInfo: string | null; prevPageInfo: string | null }> {
  const limit = String(options.limit ?? 100);
  let path: string;
  // When using page_info (cursor pagination), Shopify forbids passing status/published_status
  // and most other filters. Only pass page_info and limit. We also avoid URLSearchParams here
  // to ensure the request contains ONLY those two keys.
  if (options.page_info) {
    const pi = encodeURIComponent(options.page_info);
    path = `/products.json?page_info=${pi}&limit=${limit}`;
  } else {
    const params = new URLSearchParams();
    params.set("status", "active");
    params.set("published_status", "published");
    params.set("limit", limit);
    if (options.q) params.set("title", options.q);
    if (options.vendor) params.set("vendor", options.vendor);
    path = `/products.json?${params.toString()}`;
  }

  const res = await shopifyFetch(path);
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  const data = await res.json();
  const link = res.headers.get("link") || res.headers.get("Link");
  let nextPageInfo: string | null = null;
  let prevPageInfo: string | null = null;
  if (link) {
    // parse rel="next"; <...page_info=XYZ>; rel="next"
    const parts = link.split(",");
    for (const p of parts) {
      if (p.includes("rel=\"next\"")) {
        const m = p.match(/page_info=([^&>]+)/);
        if (m) nextPageInfo = m[1];
      }
      if (p.includes("rel=\"previous\"")) {
        const m = p.match(/page_info=([^&>]+)/);
        if (m) prevPageInfo = m[1];
      }
    }
  }
  return { products: data.products || [], nextPageInfo, prevPageInfo };
}

export async function getProductsCount(options: { q?: string; vendor?: string }): Promise<number> {
  const params = new URLSearchParams();
  params.set("status", "active");
  params.set("published_status", "published");
  if (options.q) params.set("title", options.q);
  if (options.vendor) params.set("vendor", options.vendor);
  const res = await shopifyFetch(`/products/count.json?${params.toString()}`);
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  const data = await res.json();
  return Number(data?.count ?? 0);
}

export async function getInventoryLevels(inventoryItemIds: string[]): Promise<Record<string, number>> {
  if (inventoryItemIds.length === 0) return {};
  const chunks: string[][] = [];
  for (let i = 0; i < inventoryItemIds.length; i += 50) chunks.push(inventoryItemIds.slice(i, i + 50));
  const idToQty: Record<string, number> = {};
  for (const chunk of chunks) {
    const params = new URLSearchParams();
    params.set("inventory_item_ids", chunk.join(","));
    const res = await shopifyFetch(`/inventory_levels.json?${params.toString()}`);
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    const data = await res.json();
    for (const level of data.inventory_levels || []) {
      const id = String(level.inventory_item_id);
      idToQty[id] = (idToQty[id] || 0) + (level.available ?? 0);
    }
  }
  return idToQty;
}

export async function createDraftOrder(payload: {
  email?: string;
  shipping_address: any;
  line_items: Array<{ variant_id: number; quantity: number }>;
  free_order?: boolean;
  tags?: string[];
  note?: string;
}): Promise<any> {
  const draftOrderBody: any = {
    draft_order: {
      line_items: payload.line_items,
      shipping_address: payload.shipping_address,
      customer: payload.email ? { email: payload.email } : undefined,
    },
  };
  
  // Add tags if provided
  if (payload.tags && payload.tags.length > 0) {
    draftOrderBody.draft_order.tags = payload.tags.join(", ");
  }
  
  // Add note if provided
  if (payload.note) {
    draftOrderBody.draft_order.note = payload.note;
  }
  
  if (payload.free_order) {
    draftOrderBody.draft_order.applied_discount = {
      value_type: "percentage",
      value: "100.0",
      description: "Zero-value order",
    };
  }
  
  const res = await shopifyFetch(`/draft_orders.json`, {
    method: "POST",
    body: JSON.stringify(draftOrderBody),
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return (await res.json()).draft_order;
}

export async function completeDraftOrder(draftOrderId: number): Promise<any> {
  const res = await shopifyFetch(`/draft_orders/${draftOrderId}/complete.json?payment_pending=false`, {
    method: "PUT",
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return await res.json();
}

export function verifyShopifyHmac(rawBody: string, hmacHeader?: string | null): boolean {
  const { SHOPIFY_WEBHOOK_SECRET } = getShopifyConfig();
  if (!SHOPIFY_WEBHOOK_SECRET) return true; // if secret is not set, allow but log
  if (!hmacHeader) return false;
  const digest = crypto
    .createHmac("sha256", SHOPIFY_WEBHOOK_SECRET)
    .update(rawBody, "utf8")
    .digest("base64");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
}


