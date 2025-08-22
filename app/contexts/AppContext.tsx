import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Influencer, Order, Content, MessageTemplate } from "../../shared/schema";
import * as localStorage from "../local-storage";

interface AppState {
  influencers: Influencer[];
  orders: Order[];
  content: Content[];
  messageTemplates: MessageTemplate[];
  stats: {
    totalInfluencers: number;
    activeOrders: number;
    pendingContent: number;
    completionRate: string;
  };
}

interface AppContextType extends AppState {
  // Influencer actions
  addInfluencer: (influencer: Omit<Influencer, 'id'>) => Promise<Influencer>;
  updateInfluencer: (id: string, updates: Partial<Influencer>) => Promise<Influencer | null>;
  deleteInfluencer: (id: string) => Promise<boolean>;
  
  // Order actions
  addOrder: (order: Omit<Order, 'id'>) => Promise<Order>;
  refreshOrders: () => Promise<void>;
  
  // Content actions
  addContent: (content: Omit<Content, 'id'>) => Promise<Content>;
  updateContent: (id: string, updates: Partial<Content>) => Promise<Content | null>;
  
  // Refresh data
  refreshStats: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [state, setState] = useState<AppState>({
    influencers: [],
    orders: [],
    content: [],
    messageTemplates: [],
    stats: {
      totalInfluencers: 0,
      activeOrders: 0,
      pendingContent: 0,
      completionRate: "0%"
    }
  });

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      console.log('=== APP CONTEXT: LOADING DATA FROM SERVER API ===');
      
      try {
        // Load influencers from server API ONLY
        const influencersResponse = await fetch('/api/influencers');
        let influencers: any = [];
        if (influencersResponse.ok) {
          const body = await influencersResponse.json();
          influencers = Array.isArray(body) ? body : [];
        } else {
          influencers = [];
        }
        console.log('Loaded influencers from server API:', influencers);

        // Load orders from server API so they persist across refresh
        let orders: Order[] = [];
        try {
          const ordersRes = await fetch('/api/orders');
          if (ordersRes.ok) orders = await ordersRes.json();
        } catch {}
        const content: Content[] = [];
        const messageTemplates: MessageTemplate[] = [];
        const stats = {
          totalInfluencers: influencers.length,
          activeOrders: orders.filter(o => o.status !== "Completed").length,
          pendingContent: 0,
          completionRate: influencers.length > 0 ? `${Math.round((influencers.filter((i: any) => i.status === 'Completed').length / influencers.length) * 100)}%` : '0%'
        };

        setState({
          influencers,
          orders,
          content,
          messageTemplates,
          stats
        });
      } catch (error) {
        console.error('Failed to load data from server API:', error);
        setState(prev => ({
          ...prev,
          influencers: [],
          orders: [],
          content: [],
          messageTemplates: [],
          stats: { totalInfluencers: 0, activeOrders: 0, pendingContent: 0, completionRate: '0%' }
        }));
      }
    };

    loadData();
  }, []);

  const refreshStats = () => {
    setState(prev => ({
      ...prev,
      stats: {
        totalInfluencers: prev.influencers.length,
        activeOrders: prev.orders.filter(o => o.status !== "Completed").length,
        pendingContent: prev.content.filter(c => (c as any).status === "PendingReview").length,
        completionRate: prev.influencers.length > 0 ? `${Math.round((prev.influencers.filter(i => (i as any).status === 'Completed').length / prev.influencers.length) * 100)}%` : '0%'
      }
    }));
  };

  const refreshOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const orders = res.ok ? await res.json() : [];
      setState(prev => ({
        ...prev,
        orders,
        stats: {
          ...prev.stats,
          activeOrders: orders.filter((o: any) => o.status !== 'Completed').length,
        }
      }));
    } catch (e) {
      console.error('Failed to refresh orders:', e);
    }
  };

  const addInfluencer = async (influencerData: Omit<Influencer, 'id'>): Promise<Influencer> => {
    console.log('=== APP CONTEXT: ADD INFLUENCER ===');
    console.log('Incoming influencer data:', influencerData);
    
    // Send to server API ONLY - no localStorage fallback
    const response = await fetch('/api/influencers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(influencerData)
    });
    
    console.log('Server API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server API error response:', errorText);
      throw new Error(`Failed to create influencer: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const newInfluencer = await response.json();
    console.log('Created new influencer via server API:', newInfluencer);
    
    // Update local state
    setState(prev => ({
      ...prev,
      influencers: [...prev.influencers, newInfluencer]
    }));
    
    refreshStats();
    return newInfluencer;
  };

  const updateInfluencer = async (id: string, updates: Partial<Influencer>): Promise<Influencer | null> => {
    console.log('=== APP CONTEXT: UPDATE INFLUENCER ===');
    console.log('Updating influencer ID:', id);
    console.log('Updates:', updates);
    
    // Send to server API ONLY - no localStorage fallback
    const response = await fetch(`/api/influencers/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates)
    });
    
    console.log('Server API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server API error response:', errorText);
      throw new Error(`Failed to update influencer: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const updatedInfluencer = await response.json();
    console.log('Updated influencer via server API:', updatedInfluencer);
    
    // Update local state
    setState(prev => ({
      ...prev,
      influencers: prev.influencers.map(inf => 
        inf.id === id ? updatedInfluencer : inf
      )
    }));
    
    refreshStats();
    return updatedInfluencer;
  };

  const deleteInfluencer = async (id: string): Promise<boolean> => {
    console.log('=== APP CONTEXT: DELETE INFLUENCER ===');
    console.log('Deleting influencer ID:', id);
    
    // Send to server API ONLY - no localStorage fallback
    const response = await fetch(`/api/influencers/${id}`, {
      method: 'DELETE',
    });
    
    console.log('Server API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server API error response:', errorText);
      throw new Error(`Failed to delete influencer: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    console.log('Deleted influencer via server API');
    
    // Update local state
    setState(prev => ({
      ...prev,
      influencers: prev.influencers.filter(inf => inf.id !== id)
    }));
    
    refreshStats();
    return true;
  };

  const addOrder = async (order: Omit<Order, 'id'>): Promise<Order> => {
    console.log('=== APP CONTEXT: ADD ORDER ===');
    console.log('Incoming order data:', order);
    
    // Send to server API ONLY - no localStorage fallback
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(order)
    });
    
    console.log('Server API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server API error response:', errorText);
      throw new Error(`Failed to create order: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Created order via server API:', result);
    
    // Refresh orders from server to get the updated list
    await refreshOrders();
    
    // Return a temporary order object (the real one will be loaded by refreshOrders)
    return { ...order, id: 'temp-id', createdAt: new Date(), updatedAt: new Date() };
  };

  const addContent = async (content: Omit<Content, 'id'>): Promise<Content> => {
    const newContent = localStorage.addContent(content);
    const updatedContentList = localStorage.getContent();
    setState(prev => ({
      ...prev,
      content: updatedContentList
    }));
    refreshStats();
    return newContent;
  };

  const updateContent = async (id: string, updates: Partial<Content>): Promise<Content | null> => {
    const updatedContent = localStorage.updateContent(id, updates);
    if (updatedContent) {
      const updatedContentList = localStorage.getContent();
      setState(prev => ({
        ...prev,
        content: updatedContentList
      }));
      refreshStats();
    }
    return updatedContent;
  };

  const contextValue: AppContextType = {
    ...state,
    addInfluencer,
    updateInfluencer,
    deleteInfluencer,
    addOrder,
    refreshOrders,
    addContent,
    updateContent,
    refreshStats
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};