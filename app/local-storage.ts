import type { Influencer, Order, Content, MessageTemplate } from "@shared/schema";

// Local storage keys
const STORAGE_KEYS = {
  INFLUENCERS: 'influencers',
  ORDERS: 'orders', 
  CONTENT: 'content',
  MESSAGE_TEMPLATES: 'messageTemplates'
};

// Mock data for initial state
const MOCK_INFLUENCERS: Influencer[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    phone: "+1-555-0123",
    age: 25,
    gender: "Female",
    address: "123 Main St, Los Angeles, CA",
    socialMedia: {
      instagram: {
        handle: "@sarahjohnson",
        followers: 125000
      },
      youtube: {
        channel: "Sarah J Vlogs",
        subscribers: 87000
      }
    },
    status: "Approved",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "2", 
    name: "Michael Chen",
    email: "michael.chen@example.com",
    phone: "+1-555-0124",
    age: 28,
    gender: "Male",
    address: "456 Oak Ave, San Francisco, CA",
    socialMedia: {
      instagram: {
        handle: "@mikechenfit",
        followers: 89000
      },
      youtube: {
        channel: "Chen Fitness",
        subscribers: 45000
      }
    },
    status: "OrderCreated",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "3",
    name: "Emma Davis", 
    email: "emma.davis@example.com",
    phone: "+1-555-0125",
    age: 22,
    gender: "Female",
    address: "789 Pine Blvd, Miami, FL",
    socialMedia: {
      instagram: {
        handle: "@emmadstyle",
        followers: 67000
      },
      youtube: {
        channel: "Emma's World",
        subscribers: 23000
      }
    },
    status: "PendingApproval",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const MOCK_ORDERS: Order[] = [
  {
    id: "order-1",
    influencerId: "1",
    companyId: "company-1",
    shopifyOrderId: "SHO-001",
    status: "Shipped",
    trackingInfo: {
      status: "In Transit",
      trackingNumber: "1Z999AA1234567890",
      estimatedDelivery: new Date("2024-01-25")
    },
    products: [
      { id: "1", name: "Premium Skincare Set", price: 89.99, quantity: 1 },
      { id: "3", name: "Fitness Tracker", price: 149.99, quantity: 1 }
    ],
    shippingDetails: {
      firstName: "Sarah",
      lastName: "Johnson",
      address: "123 Beauty Lane",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90210",
      phone: "+1 (555) 123-4567",
      email: "sarah@example.com"
    },
    totalAmount: 239.98,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20")
  },
  {
    id: "order-2",
    influencerId: "2",
    companyId: "company-1",
    shopifyOrderId: "SHO-002",
    status: "Processing",
    trackingInfo: {
      status: "Preparing",
      trackingNumber: "",
      estimatedDelivery: new Date("2024-01-30")
    },
    products: [
      { id: "2", name: "Wireless Headphones", price: 199.99, quantity: 1 }
    ],
    shippingDetails: {
      firstName: "Mike",
      lastName: "Chen",
      address: "456 Tech Street",
      city: "San Francisco",
      state: "CA",
      zipCode: "94102",
      phone: "+1 (555) 987-6543",
      email: "mike@example.com"
    },
    totalAmount: 199.99,
    createdAt: new Date("2024-01-18"),
    updatedAt: new Date("2024-01-18")
  }
];

const MOCK_MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: "1",
    type: "WhatsApp",
    message: "Welcome to our influencer program! We're excited to work with you.",
    workflowCategory: "Onboarding",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "2", 
    type: "WhatsApp",
    message: "Your content has been approved! Thank you for your amazing work.",
    workflowCategory: "Content",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "3",
    type: "WhatsApp",
    message: "Great news! Your order has been shipped and is on its way to you.",
    workflowCategory: "Order Updates",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Local storage utilities
export class LocalStorage {
  static get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  }
}

// Data access functions
export const getInfluencers = (): Influencer[] => {
  return LocalStorage.get(STORAGE_KEYS.INFLUENCERS, MOCK_INFLUENCERS);
};

export const saveInfluencers = (influencers: Influencer[]): void => {
  LocalStorage.set(STORAGE_KEYS.INFLUENCERS, influencers);
};

export const addInfluencer = (influencer: Omit<Influencer, 'id'>): Influencer => {
  const influencers = getInfluencers();
  const newInfluencer: Influencer = {
    ...influencer,
    id: Date.now().toString()
  };
  const updatedInfluencers = [...influencers, newInfluencer];
  saveInfluencers(updatedInfluencers);
  return newInfluencer;
};

export const updateInfluencer = (id: string, updates: Partial<Influencer>): Influencer | null => {
  const influencers = getInfluencers();
  const index = influencers.findIndex(i => i.id === id);
  if (index === -1) return null;

  const updatedInfluencer = { ...influencers[index], ...updates };
  influencers[index] = updatedInfluencer;
  saveInfluencers(influencers);
  return updatedInfluencer;
};

export const deleteInfluencer = (id: string): boolean => {
  const influencers = getInfluencers();
  const filteredInfluencers = influencers.filter(i => i.id !== id);
  if (filteredInfluencers.length === influencers.length) return false;
  
  saveInfluencers(filteredInfluencers);
  return true;
};

export const getOrders = (): Order[] => {
  return LocalStorage.get(STORAGE_KEYS.ORDERS, MOCK_ORDERS);
};

export const saveOrders = (orders: Order[]): void => {
  LocalStorage.set(STORAGE_KEYS.ORDERS, orders);
};

export const addOrder = (order: Omit<Order, 'id'>): Order => {
  const orders = getOrders();
  const newOrder: Order = {
    ...order,
    id: Date.now().toString()
  };
  const updatedOrders = [...orders, newOrder];
  saveOrders(updatedOrders);
  return newOrder;
};

export const getContent = (): Content[] => {
  return LocalStorage.get(STORAGE_KEYS.CONTENT, []);
};

export const saveContent = (content: Content[]): void => {
  LocalStorage.set(STORAGE_KEYS.CONTENT, content);
};

export const addContent = (content: Omit<Content, 'id'>): Content => {
  const contentList = getContent();
  const newContent: Content = {
    ...content,
    id: Date.now().toString()
  };
  const updatedContentList = [...contentList, newContent];
  saveContent(updatedContentList);
  return newContent;
};

export const updateContent = (id: string, updates: Partial<Content>): Content | null => {
  const content = getContent();
  const index = content.findIndex(c => c.id === id);
  if (index === -1) return null;

  const updatedContent = { ...content[index], ...updates };
  content[index] = updatedContent;
  saveContent(content);
  return updatedContent;
};

export const getMessageTemplates = (): MessageTemplate[] => {
  return LocalStorage.get(STORAGE_KEYS.MESSAGE_TEMPLATES, MOCK_MESSAGE_TEMPLATES);
};

export const getStats = () => {
  const influencers = getInfluencers();
  const orders = getOrders();
  const content = getContent();

  return {
    totalInfluencers: influencers.length,
    activeOrders: orders.filter(o => o.status !== "Completed").length,
    pendingContent: content.filter(c => c.status === "PendingReview").length,
    completionRate: influencers.length > 0 ? `${Math.round((influencers.filter(i => i.status === "Completed").length / influencers.length) * 100)}%` : "0%"
  };
};