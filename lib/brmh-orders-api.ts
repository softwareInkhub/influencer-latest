import type { Order } from "@shared/schema";
import { randomUUID } from "crypto";

// BRMH Orders API client for DynamoDB table: brmh-Influencer-orders
// Uses the same BRMH /crud interface pattern as influencers

type BrmhOrderTableItem = {
  id: string;
  influencerId: string;
  companyId: string;
  shopifyOrderId: string;
  status: string;
  totalAmount?: number;
  createdAt?: string;
  updatedAt?: string;
  // Custom fields bucket
  data?: any; // contains products, shippingDetails, trackingInfo
};

export class BRMHOrdersAPI {
  private baseURL = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://brmh.in'}/crud`;
  private tableName = 'brmh-Influencer-orders';

  private toTableItem(order: Order): BrmhOrderTableItem {
    return {
      // Ensure we always provide a stable primary key for DynamoDB via BRMH
      // Prefer the external order id we track (shopifyOrderId), then local id, then a generated UUID
      id: String((order as any).shopifyOrderId || order.id || randomUUID()),
      influencerId: String(order.influencerId),
      companyId: String(order.companyId),
      shopifyOrderId: String(order.shopifyOrderId),
      status: String(order.status || 'Created'),
      totalAmount: order.totalAmount ?? undefined,
      createdAt: (order.createdAt instanceof Date ? order.createdAt.toISOString() : (order.createdAt as any)) || new Date().toISOString(),
      updatedAt: (order.updatedAt instanceof Date ? order.updatedAt.toISOString() : (order.updatedAt as any)) || new Date().toISOString(),
      data: {
        products: order.products || [],
        shippingDetails: order.shippingDetails || undefined,
        trackingInfo: order.trackingInfo || undefined,
      },
    };
  }

  private fromTableItem(item: any): Order {
    const dataObj = typeof item?.data === 'string' ? (() => { try { return JSON.parse(item.data); } catch { return {}; } })() : (item?.data || {});
    return {
      id: String(item.id),
      influencerId: String(item.influencerId),
      companyId: String(item.companyId),
      shopifyOrderId: String(item.shopifyOrderId),
      status: String(item.status || 'Created'),
      trackingInfo: dataObj.trackingInfo,
      products: Array.isArray(dataObj.products) ? dataObj.products : [],
      shippingDetails: dataObj.shippingDetails,
      totalAmount: item.totalAmount ?? undefined,
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
    } as unknown as Order;
  }

  async listOrders(): Promise<Order[]> {
    console.log('=== BRMH ORDERS API: LIST ORDERS ===');
    console.log('BRMH Request URL:', `${this.baseURL}?tableName=${this.tableName}&pagination=true&itemPerPage=100`);
    
    const res = await fetch(`${this.baseURL}?tableName=${this.tableName}&pagination=true&itemPerPage=100`);
    
    console.log('BRMH Response Status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('BRMH Error Response:', errorText);
      throw new Error(`BRMH list orders failed: ${res.status} ${res.statusText} - ${errorText}`);
    }
    
    const body = await res.json();
    console.log('BRMH Success Response:', JSON.stringify(body, null, 2));
    
    const items = Array.isArray(body?.items) ? body.items : [];
    console.log('Found items:', items.length);
    
    return items.map((it: any) => this.fromTableItem(it));
  }

  async getOrder(id: string): Promise<Order> {
    const res = await fetch(`${this.baseURL}?tableName=${this.tableName}&id=${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`BRMH get order failed: ${res.status}`);
    const body = await res.json();
    if (!body?.success || !body?.item) throw new Error('Order not found');
    return this.fromTableItem(body.item);
  }

  async createOrder(order: Order): Promise<{ success: boolean; itemId: string }> {
    console.log('=== BRMH ORDERS API: CREATE ORDER ===');
    console.log('Input order data:', JSON.stringify(order, null, 2));
    
    const tableItem = this.toTableItem(order);
    console.log('Transformed table item:', JSON.stringify(tableItem, null, 2));
    
    const requestBody = { item: tableItem };
    console.log('BRMH Request URL:', `${this.baseURL}?tableName=${this.tableName}`);
    console.log('BRMH Request Body:', JSON.stringify(requestBody, null, 2));
    
    const res = await fetch(`${this.baseURL}?tableName=${this.tableName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    console.log('BRMH Response Status:', res.status);
    console.log('BRMH Response Headers:', Object.fromEntries(res.headers.entries()));
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('BRMH Error Response:', errorText);
      throw new Error(`BRMH create order failed: ${res.status} ${res.statusText} - ${errorText}`);
    }
    
    const responseData = await res.json();
    console.log('BRMH Success Response:', JSON.stringify(responseData, null, 2));
    return responseData;
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<{ success: boolean }> {
    const partial: any = {};
    if (updates.status !== undefined) partial.status = updates.status;
    if (updates.shopifyOrderId !== undefined) partial.shopifyOrderId = updates.shopifyOrderId;
    if (updates.totalAmount !== undefined) partial.totalAmount = updates.totalAmount;
    if (updates.createdAt !== undefined) partial.createdAt = (updates.createdAt instanceof Date ? updates.createdAt.toISOString() : updates.createdAt);
    partial.updatedAt = (updates.updatedAt instanceof Date ? updates.updatedAt.toISOString() : (updates.updatedAt || new Date().toISOString()));

    // merge nested data
    const data: any = {};
    if (updates.products !== undefined) data.products = updates.products;
    if (updates.shippingDetails !== undefined) data.shippingDetails = updates.shippingDetails;
    if (updates.trackingInfo !== undefined) data.trackingInfo = updates.trackingInfo;
    if (Object.keys(data).length > 0) partial.data = data;

    const res = await fetch(`${this.baseURL}?tableName=${this.tableName}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: { id }, updates: partial })
    });
    if (!res.ok) throw new Error(`BRMH update order failed: ${res.status}`);
    return res.json();
  }

  async deleteOrder(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${this.baseURL}?tableName=${this.tableName}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (!res.ok) throw new Error(`BRMH delete order failed: ${res.status}`);
    return res.json();
  }

  async testConnection(): Promise<boolean> {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://brmh.in'}/test`);
      return res.ok;
    } catch {
      return false;
    }
  }
}


