import type { Influencer, Order, Content, MessageTemplate } from "@shared/schema";

// Local storage keys
const STORAGE_KEYS = {
  INFLUENCERS: 'influencers',
  ORDERS: 'orders', 
  CONTENT: 'content',
  MESSAGE_TEMPLATES: 'messageTemplates'
};

// Empty initial state - no dummy data
const INITIAL_INFLUENCERS: Influencer[] = [];

const INITIAL_ORDERS: Order[] = [];

const INITIAL_MESSAGE_TEMPLATES: MessageTemplate[] = [];

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
  return LocalStorage.get(STORAGE_KEYS.INFLUENCERS, INITIAL_INFLUENCERS);
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
  return LocalStorage.get(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
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
  return LocalStorage.get(STORAGE_KEYS.MESSAGE_TEMPLATES, INITIAL_MESSAGE_TEMPLATES);
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