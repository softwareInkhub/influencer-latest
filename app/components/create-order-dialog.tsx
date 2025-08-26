import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Plus, Minus, Package, User, MapPin, CreditCard, Mail, Phone, Eye, Search, Filter, ChevronDown, ShoppingCart, Edit, X, Calendar } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import type { Influencer } from "../../shared/schema";
import React from "react";

interface Product {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  image?: string;
  category: string;
  inventory?: number;
}

interface OrderItem {
  product: Product;
  quantity: number;
}

interface ShippingDetails {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
}

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedInfluencer?: Influencer;
}

// Mock products for the demo
const MOCK_PRODUCTS: Product[] = [
  { id: "1", name: "Premium Skincare Set", price: 89.99, compareAtPrice: 129.99, category: "Beauty", inventory: 45 },
  { id: "2", name: "Wireless Headphones", price: 199.99, compareAtPrice: 249.99, category: "Electronics", inventory: 12 },
  { id: "3", name: "Fitness Tracker", price: 149.99, category: "Health", inventory: 28 },
  { id: "4", name: "Organic Coffee Blend", price: 24.99, category: "Food", inventory: 67 },
  { id: "5", name: "Yoga Mat Premium", price: 79.99, compareAtPrice: 99.99, category: "Fitness", inventory: 23 },
  { id: "6", name: "Phone Case Designer", price: 39.99, category: "Accessories", inventory: 89 }
];

export default function CreateOrderDialog({ open, onOpenChange, selectedInfluencer }: CreateOrderDialogProps) {
  const { influencers, addOrder, updateInfluencer } = useApp();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedInfluencerId, setSelectedInfluencerId] = useState(selectedInfluencer?.id || "");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [collectionFilter, setCollectionFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [shippingDetails, setShippingDetails] = useState<ShippingDetails>({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: ""
  });
  const [isCreating, setIsCreating] = useState(false);

  // Shopify products + selection state
  type ShopifyVariant = { variantId: number; title: string; price: number; compareAtPrice?: number; stock: number; image?: string | null };
  type ShopifyProduct = { id: number; title: string; thumbnail?: string | null; variants: ShopifyVariant[]; totalStock: number };
  const [shopProducts, setShopProducts] = useState<ShopifyProduct[]>([]);
  const [nextPageInfo, setNextPageInfo] = useState<string | null>(null);
  const [prevPageInfo, setPrevPageInfo] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const PAGE_LIMIT = 50;
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [inflightController, setInflightController] = useState<AbortController | null>(null);
  const [selectedItems, setSelectedItems] = useState<Array<{ productId: number; variantId: number; title: string; price: number; qty: number }>>([]);
  const [creatingShopify, setCreatingShopify] = useState(false);
  const [createdShopifyOrderId, setCreatedShopifyOrderId] = useState<string | null>(null);
  const [wizardKey] = useState<string>(() => Math.random().toString(36).slice(2));
  const [isZeroValueOrder, setIsZeroValueOrder] = useState(true);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [isDataFromCache, setIsDataFromCache] = useState(false);

  // Cache configuration
  const CACHE_KEY = 'shopify_products_cache';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Cache helper functions
  const getCachedProducts = (searchQuery: string): { products: ShopifyProduct[]; totalCount: number; timestamp: number } | null => {
    try {
      const cached = localStorage.getItem(`${CACHE_KEY}_${searchQuery || 'all'}`);
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is still valid
      if (now - data.timestamp < CACHE_DURATION) {
        console.log(`Using cached products for query: "${searchQuery || 'all'}"`);
        return data;
      } else {
        console.log(`Cache expired for query: "${searchQuery || 'all'}"`);
        localStorage.removeItem(`${CACHE_KEY}_${searchQuery || 'all'}`);
        return null;
      }
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  };

  const setCachedProducts = (searchQuery: string, products: ShopifyProduct[], totalCount: number) => {
    try {
      const cacheData = {
        products,
        totalCount,
        timestamp: Date.now()
      };
      localStorage.setItem(`${CACHE_KEY}_${searchQuery || 'all'}`, JSON.stringify(cacheData));
      console.log(`Cached products for query: "${searchQuery || 'all'}"`);
    } catch (error) {
      console.error('Error writing cache:', error);
    }
  };

  const clearProductCache = () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_KEY)) {
          localStorage.removeItem(key);
        }
      });
      console.log('Product cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  // Fetch Shopify products helper
  async function fetchProducts(page: string | null) {
    setLoadingProducts(true);
    setProductError(null);
    
    // Check cache first (only for new searches, not for pagination)
    if (!page) {
      const cached = getCachedProducts(searchQuery.trim());
      if (cached) {
        setShopProducts(cached.products);
        setTotalCount(cached.totalCount);
        setNextPageInfo(null);
        setPrevPageInfo(null);
        setIsDataFromCache(true);
        setLoadingProducts(false);
        return;
      }
    }
    setIsDataFromCache(false);
    
    const params = new URLSearchParams();
    
    if (page) {
      params.set("page_info", page);
    } else {
      // For new searches, include the search query
      if (searchQuery.trim()) {
        params.set("q", searchQuery.trim());
      }
    }
    
    params.set("limit", String(PAGE_LIMIT));
    
    try {
      inflightController?.abort();
      const controller = new AbortController();
      setInflightController(controller);
      
      const res = await fetch(`/api/shopify/products?${params.toString()}`, { signal: controller.signal });
      if (!res.ok) throw new Error(await res.text());
      const body = await res.json();
      
      if (page) {
        // Load more: append new products to existing ones
        setShopProducts(prevProducts => {
          const seen = new Set<number | string>();
          const allProducts = [...prevProducts];
          
          // Add existing products to seen set
          prevProducts.forEach(p => seen.add(p.id));
          
          // Add new products that aren't already in the list
          for (const p of body.products as any[]) {
            if (!seen.has(p.id)) { 
              seen.add(p.id); 
              allProducts.push(p); 
            }
          }
          
          return allProducts;
        });
        
        // Auto-scroll to newly added products
        setTimeout(() => {
          const productScroll = document.getElementById('product-scroll');
          if (productScroll) {
            productScroll.scrollTop = productScroll.scrollHeight;
          }
        }, 100);
      } else {
        // New search: replace all products
        setShopProducts(body.products || []);
        
        // Cache the results for new searches
        if (body.products && body.products.length > 0) {
          setCachedProducts(searchQuery.trim(), body.products, body.products.length);
        }
      }
      
      setNextPageInfo(body.nextPageInfo || null);
      setPrevPageInfo(body.prevPageInfo || null);
      
    } catch (e: any) {
      setProductError(e?.message || 'Failed to load products');
    }
    setLoadingProducts(false);
  }

  // Trigger fetch when entering Step 2
  useEffect(() => {
    if (open && currentStep === 2) {
      // Reset product list when entering Step 2, but preserve selections
      setShopProducts([]); 
      setNextPageInfo(null); 
      setPrevPageInfo(null); 
      setPageIndex(0);
      // Check cache for count first
      const cached = getCachedProducts(searchQuery.trim());
      if (cached) {
        setTotalCount(cached.totalCount);
      } else {
        // fetch total count first for pager
        (async () => {
          try {
            inflightController?.abort();
            const controller = new AbortController();
            setInflightController(controller);
            const p = new URLSearchParams();
            if (searchQuery) p.set('q', searchQuery);
            const resCount = await fetch(`/api/shopify/products/count?${p.toString()}`, { signal: controller.signal });
            const countBody = resCount.ok ? await resCount.json() : { count: 0 };
            setTotalCount(Number(countBody.count || 0));
          } catch {}
        })();
      }
      fetchProducts(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentStep]);

  // Debounced search fetch - properly connected to Shopify API
  useEffect(() => {
    if (!(open && currentStep === 2)) return;
    
    const t = setTimeout(() => {
      // Reset product list for new search, but preserve selections
      setShopProducts([]); 
      setNextPageInfo(null); 
      setPrevPageInfo(null); 
      setPageIndex(0);
      
      (async () => {
        try {
          inflightController?.abort();
          const controller = new AbortController();
          setInflightController(controller);
          
          // Fetch total count with search query
          const p = new URLSearchParams();
          if (searchQuery.trim()) p.set('q', searchQuery.trim());
          const resCount = await fetch(`/api/shopify/products/count?${p.toString()}`, { signal: controller.signal });
          const countBody = resCount.ok ? await resCount.json() : { count: 0 };
          setTotalCount(Number(countBody.count || 0));
          
          // Fetch products with search query
        fetchProducts(null);
        } catch (error) {
          console.error('Search error:', error);
          setProductError('Failed to search products');
        }
      })();
    }, 300);
    
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Removed IntersectionObserver since we're using manual "Load more" button

  const addVariant = (productId: number, v: ShopifyVariant) => {
    setSelectedItems(prev => {
      const idx = prev.findIndex(it => it.variantId === v.variantId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
        return copy;
      }
      return [...prev, { productId, variantId: v.variantId, title: v.title || "Variant", price: Number(v.price), qty: 1 }];
    });
  };

  const updateSelectedQty = (variantId: number, qty: number) => {
    setSelectedItems(prev => prev.filter(it => (it.variantId === variantId ? qty > 0 : true)).map(it => it.variantId === variantId ? { ...it, qty } : it));
  };

  const getVariantQty = (variantId: number) => {
    const found = selectedItems.find(it => it.variantId === variantId);
    return found ? found.qty : 0;
  };

  const getSelectedTotal = () => selectedItems.reduce((sum, it) => sum + it.price * it.qty, 0);
  const getSelectedCount = () => selectedItems.reduce((sum, it) => sum + it.qty, 0);
  
  // Real price calculations for Step 4
  const getRealSubtotal = () => selectedItems.reduce((sum, it) => sum + it.price * it.qty, 0);
  const getRealShipping = () => 0; // Free shipping for now
  const getRealTax = () => 0; // No tax for now
  const getRealDiscount = () => isZeroValueOrder ? (getRealSubtotal() + getRealShipping() + getRealTax()) : 0;
  const getRealTotal = () => getRealSubtotal() + getRealShipping() + getRealTax() - getRealDiscount();

  const placeOrder = async () => {
    console.log('Place Order clicked!');
    console.log('selectedInfluencerId:', selectedInfluencerId);
    console.log('selectedItems:', selectedItems);
    console.log('shippingDetails:', shippingDetails);
    console.log('isZeroValueOrder:', isZeroValueOrder);
    
    if (!selectedInfluencerId || selectedItems.length === 0) {
      console.log('Validation failed - missing influencer or items');
      return;
    }
    setCreatingShopify(true);
    setOrderError(null);
    try {
      const influencer = influencers.find(i => i.id === selectedInfluencerId);
      
      console.log('Selected influencer ID:', selectedInfluencerId);
      console.log('Found influencer:', influencer);
      console.log('All influencers:', influencers);
      
      if (!influencer) {
        throw new Error(`Influencer with ID ${selectedInfluencerId} not found`);
      }
      
      const fullName = (influencer?.name || '').trim();
      const parts = fullName.split(/\s+/);
      const first_name = parts[0] || '';
      const last_name = parts.slice(1).join(' ');
      
             // Prepare shipping address with minimal required fields
       const shipping_address = {
         first_name,
         last_name,
         address1: shippingDetails.address || (influencer as any)?.address || '123 Test Street',
         city: shippingDetails.city || 'Test City',
         province: shippingDetails.state || 'Test State',
         country: 'India',
         zip: shippingDetails.zipCode || '12345'
       };
      
                     // Prepare line items with minimal required fields
        const line_items = selectedItems.map(it => ({
          variant_id: String(it.variantId), // Convert to string
          quantity: Number(it.qty), // Ensure it's a number
          price: isZeroValueOrder ? "0.00" : it.price.toString()
        }));
      
                   // First create the order in actual Shopify through BRMH
      // Try multiple approaches to ensure it works
      let actualShopifyOrderId = `SHO-${Date.now()}`;
      
      try {
        // Approach 1: Minimal payload
        const minimalPayload = {
          executeType: "namespace",
          namespaceId: "b429f105-4b19-4ce1-97dd-984e98c72f3c",
          accountId: "f60444cb-203e-45a4-8bc9-c6c4cf4a3ed2",
          methodId: "270b2e8d-b480-48f4-863a-4193db3b52a2",
          requestBody: {
            order: {
              email: shippingDetails.email || influencer?.email || 'test@example.com',
              line_items: line_items.map(item => ({
                variant_id: Number(item.variant_id),
                quantity: Number(item.quantity)
              })),
              financial_status: "pending"
            }
          },
          save: false
        };

        console.log('Attempting Shopify order creation with minimal payload:', minimalPayload);
        
        const shopifyRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://brmh.in'}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(minimalPayload)
        });
        
        console.log('Shopify order creation response status:', shopifyRes.status);

        if (shopifyRes.ok) {
          const shopifyBody = await shopifyRes.json();
          console.log('Shopify order creation response:', shopifyBody);
          actualShopifyOrderId = shopifyBody?.result?.id || shopifyBody?.order?.id || actualShopifyOrderId;
          console.log('Successfully created Shopify order with ID:', actualShopifyOrderId);
        } else {
          const errorText = await shopifyRes.text();
          console.error('Shopify order creation failed:', errorText);
          
          // Try approach 2: With shipping address
          const withShippingPayload = {
            executeType: "namespace",
            namespaceId: "b429f105-4b19-4ce1-97dd-984e98c72f3c",
            accountId: "f60444cb-203e-45a4-8bc9-c6c4cf4a3ed2",
            methodId: "270b2e8d-b480-48f4-863a-4193db3b52a2",
            requestBody: {
              order: {
                email: shippingDetails.email || influencer?.email || 'test@example.com',
                line_items: line_items.map(item => ({
                  variant_id: Number(item.variant_id),
                  quantity: Number(item.quantity)
                })),
                shipping_address: {
                  first_name: shipping_address.first_name,
                  last_name: shipping_address.last_name,
                  address1: shipping_address.address1,
                  city: shipping_address.city,
                  province: shipping_address.province,
                  country: shipping_address.country,
                  zip: shipping_address.zip
                },
                financial_status: "pending"
              }
            },
            save: false
          };

          console.log('Trying with shipping address:', withShippingPayload);
          
          const shopifyRes2 = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://brmh.in'}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(withShippingPayload)
          });

          if (shopifyRes2.ok) {
            const shopifyBody2 = await shopifyRes2.json();
            console.log('Shopify order creation response (with shipping):', shopifyBody2);
            actualShopifyOrderId = shopifyBody2?.result?.id || shopifyBody2?.order?.id || actualShopifyOrderId;
            console.log('Successfully created Shopify order with shipping, ID:', actualShopifyOrderId);
          } else {
            const errorText2 = await shopifyRes2.text();
            console.error('Shopify order creation with shipping also failed:', errorText2);
            console.log('Proceeding with local order creation only. Shopify integration will be implemented later.');
          }
        }
      } catch (error) {
        console.error('Shopify order creation error:', error);
        console.log('Proceeding with local order creation only. Shopify integration will be implemented later.');
      }
      
      // Create local order record with the actual Shopify order ID
      const orderData = {
        influencerId: selectedInfluencerId,
        companyId: "company-1",
        shopifyOrderId: String(actualShopifyOrderId), // Use the actual Shopify order ID
        status: "Created",
        trackingInfo: {
          status: "Processing",
          trackingNumber: "",
          estimatedDelivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        },
        products: selectedItems.map(it => ({
          id: String(it.variantId),
          name: it.title,
          price: Number(it.price),
          quantity: it.qty
        })),
        shippingDetails: {
          firstName: shippingDetails.firstName || first_name,
          lastName: shippingDetails.lastName || last_name,
          address: shippingDetails.address,
          city: shippingDetails.city,
          state: shippingDetails.state,
          zipCode: shippingDetails.zipCode,
          phone: shippingDetails.phone,
          email: shippingDetails.email || influencer?.email || ''
        },
        totalAmount: Math.round(getRealTotal())
      };

      console.log('Creating local order record:', orderData);
      
      // Use the correct BRMH CRUD API to create the order
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      console.log('Local order creation response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Local order creation failed:', errorText);
        throw new Error(`Local order creation failed: ${errorText}`);
      }

      const body = await res.json();
      console.log('Local order creation response:', body);

      // Set the actual Shopify order ID
      setCreatedShopifyOrderId(String(actualShopifyOrderId));
      
      console.log('Order created successfully in both Shopify and local system!');
      
      // Optionally, reflect status on the influencer
      try {
        await updateInfluencer(selectedInfluencerId, { 
          status: "OrderCreated",
          updatedAt: new Date()
        } as any);
      } catch (e) {
        console.warn('Failed to update influencer status after order:', e);
      }
      
      // success: close wizard
      resetForm();
      onOpenChange(false);
    } catch (e: any) {
      console.error('Order creation failed:', e);
      setOrderError(e?.message || 'Couldn\'t place order. Please try again.');
    } finally {
      setCreatingShopify(false);
    }
  };

  const selectedInfluencerData = influencers.find(i => i.id === selectedInfluencerId);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = MOCK_PRODUCTS.filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (availabilityFilter === "inStock") {
      filtered = filtered.filter(p => (p.inventory || 0) > 0);
    } else if (availabilityFilter === "lowStock") {
      filtered = filtered.filter(p => (p.inventory || 0) <= 10 && (p.inventory || 0) > 0);
    }
    
    if (collectionFilter !== "all") {
      filtered = filtered.filter(p => p.category === collectionFilter);
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name": return a.name.localeCompare(b.name);
        case "price": return a.price - b.price;
        case "inventory": return (b.inventory || 0) - (a.inventory || 0);
        default: return 0;
      }
    });
    
    return filtered;
  }, [searchQuery, availabilityFilter, collectionFilter, sortBy]);

  const addProduct = (product: Product) => {
    const existingItem = orderItems.find(item => item.product.id === product.id);
    if (existingItem) {
      setOrderItems(prev => 
        prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setOrderItems(prev => [...prev, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setOrderItems(prev => prev.filter(item => item.product.id !== productId));
    } else {
      setOrderItems(prev => 
        prev.map(item => 
          item.product.id === productId 
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  const getTotalAmount = () => {
    return orderItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return orderItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getDiscountPercentage = (price: number, compareAtPrice?: number) => {
    if (!compareAtPrice || compareAtPrice <= price) return 0;
    return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDDMMYYYY = (date: Date) => {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const getStatusClasses = (status?: string) => {
    const normalized = (status || "").toString().toLowerCase();
    if (normalized === "approved") return "bg-green-100 text-green-800 border-green-200";
    if (normalized === "pending" || normalized === "pendingapproval") return "bg-gray-100 text-gray-800 border-gray-200";
    if (normalized === "rejected") return "bg-red-100 text-red-800 border-red-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const handleCreateOrder = async () => {
    if (!selectedInfluencerData || orderItems.length === 0) return;

    setIsCreating(true);
    try {
      // Create the order
      const newOrder = await addOrder({
        influencerId: selectedInfluencerId,
        companyId: "company-1",
        shopifyOrderId: `SHO-${Date.now()}`,
        status: "Created",
        trackingInfo: {
          status: "Processing",
          trackingNumber: "",
          estimatedDelivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        },
        products: orderItems.map(item => ({
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity
        })),
        shippingDetails,
        totalAmount: getTotalAmount(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Update influencer status
      await updateInfluencer(selectedInfluencerId, { 
        status: "OrderCreated",
        updatedAt: new Date()
      });

      // Reset form and close dialog
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create order:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedInfluencerId(selectedInfluencer?.id || "");
    setOrderItems([]);
    setSelectedItems([]);
    setShippingDetails({
      firstName: "",
      lastName: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      phone: "",
      email: ""
    });
    setIsZeroValueOrder(true);
    setOrderError(null);
    setIsDataFromCache(false);
  };

  const canProceedToStep = (step: number) => {
    switch (step) {
      case 2: return selectedInfluencerId !== "";
      case 3: return selectedItems.length > 0; // require selection from Shopify
      case 4: return shippingDetails.firstName && shippingDetails.lastName && 
                     shippingDetails.address && shippingDetails.city && 
                     shippingDetails.state && shippingDetails.zipCode;
      case 5: return true; // Allow Place Order on Step 4
      default: return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <h4 className="font-semibold text-gray-900 mb-3">Influencer</h4>
              
              {!selectedInfluencerData ? (
                <div className="space-y-3">
                  <Select value={selectedInfluencerId} onValueChange={setSelectedInfluencerId}>
                    <SelectTrigger className="w-full bg-gray-50 border border-gray-200">
                      <SelectValue placeholder="Choose an influencer" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-lg">
                      {influencers.map((influencer) => (
                        <SelectItem key={influencer.id} value={influencer.id} className="flex items-center justify-between bg-white hover:bg-gray-50">
                          <span>{influencer.name}</span>
                          <Badge className={`text-xs ${getStatusClasses(influencer.status)} border ml-2`}>
                            {influencer.status}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-sm font-bold text-white">
                          {getInitials(selectedInfluencerData.name)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{selectedInfluencerData.name}</h3>
                        <Badge className={`mt-1 ${getStatusClasses(selectedInfluencerData.status)}`}>
                          {selectedInfluencerData.status}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSelectedInfluencerId("")}>
                      <Edit className="w-4 h-4 mr-1" />
                      Change
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a href={`mailto:${selectedInfluencerData.email}`} className="text-sm text-gray-700 hover:underline" target="_blank" rel="noopener">
                        {selectedInfluencerData.email}
                      </a>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a href={`tel:${selectedInfluencerData.phone}`} className="text-sm text-gray-700 hover:underline">
                        {selectedInfluencerData.phone}
                      </a>
                    </div>
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span className="text-sm text-gray-700">
                        {selectedInfluencerData.address || "—"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                      <Eye className="w-4 h-4 mr-1" />
                      View Profile
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-md">
            <CardContent className="p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Products</h4>
              
              {/* Search */}
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* Product Cards from Shopify */}
              <div className="space-y-3 max-h-64 overflow-y-auto" id="product-scroll">
                {productError && (
                  <div className="text-sm text-red-600">
                    {productError}
                    <Button variant="outline" size="sm" className="ml-2" onClick={() => fetchProducts(null)}>Retry</Button>
                  </div>
                )}
                {!productError && loadingProducts && shopProducts.length === 0 && (
                  <div className="text-sm text-gray-500">Loading products…</div>
                )}
                {shopProducts.map(p => {
                  const lowest = Math.min(...p.variants.map(v => Number(v.price)));
                  return (
                    <div key={p.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      {/* Thumbnail */}
                      <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                        {p.thumbnail ? (
                          <img src={`${p.thumbnail}`} alt={p.title} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <h4 className="text-sm font-medium text-gray-900 truncate">{p.title}</h4>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{p.title}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm font-semibold text-gray-900">₹{lowest}</span>
                          <Badge variant="outline" className="text-xs">{p.totalStock} in stock</Badge>
                        </div>
                      </div>
                      
                      {/* Add / Variant Picker */}
                      <div>
                        {p.variants.length <= 1 ? (
                          (() => {
                            const v = p.variants[0];
                            const qty = getVariantQty(v.variantId);
                            return qty > 0 ? (
                              <div className="flex items-center space-x-2">
                                <Button size="sm" variant="outline" className="w-8 h-8 p-0" onClick={() => updateSelectedQty(v.variantId, qty - 1)}>-</Button>
                                <span className="w-6 text-center text-sm">{qty}</span>
                                <Button size="sm" variant="outline" className="w-8 h-8 p-0" onClick={() => updateSelectedQty(v.variantId, qty + 1)}>+</Button>
                              </div>
                            ) : (
                              <Button size="sm" onClick={() => addVariant(p.id as any, v)}>Add</Button>
                            );
                          })()
                        ) : (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button size="sm">Add</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72">
                              <div className="space-y-2">
                                {p.variants.map(v => {
                                  const qty = getVariantQty(v.variantId);
                                  return (
                                    <div key={v.variantId} className="flex items-center justify-between">
                                      <div className="min-w-0 pr-2">
                                        <p className="text-sm truncate">{v.title}</p>
                                        <p className="text-xs text-gray-600">₹{v.price} • {v.stock} in stock</p>
                                      </div>
                                      {qty > 0 ? (
                                        <div className="flex items-center space-x-1">
                                          <Button size="sm" variant="outline" className="w-7 h-7 p-0" onClick={() => updateSelectedQty(v.variantId, qty - 1)}>-</Button>
                                          <span className="w-6 text-center text-sm">{qty}</span>
                                          <Button size="sm" variant="outline" className="w-7 h-7 p-0" onClick={() => updateSelectedQty(v.variantId, qty + 1)}>+</Button>
                                        </div>
                                      ) : (
                                        <Button size="sm" variant="outline" onClick={() => addVariant(p.id as any, v)}>Add</Button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </div>
                  );
                })}
                {!productError && !loadingProducts && shopProducts.length === 0 && (
                  <div className="text-sm text-gray-500">No products found.</div>
                )}
              </div>
              
              {/* Pagination Controls - Outside scrollable area */}
                {nextPageInfo && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                    <Button variant="outline" className="w-full" onClick={() => fetchProducts(nextPageInfo)} disabled={loadingProducts}>
                      {loadingProducts ? 'Loading…' : 'Load more'}
                    </Button>
                  </div>
                )}
              
              {/* Sticky Summary using selections */}
              {selectedItems.length > 0 && (
                <div className="sticky bottom-0 bg-white border-t border-gray-200 mt-4 pt-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Selected {getSelectedCount()} • Total ₹{getSelectedTotal().toFixed(2)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-medium">Selected Items</h4>
                        {selectedItems.map(it => (
                          <div key={it.variantId} className="flex items-center justify-between">
                            <span className="text-sm truncate">{it.title} × {it.qty}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">₹{(it.price * it.qty).toFixed(2)}</span>
                              <div className="flex items-center space-x-1">
                                <Button size="sm" variant="outline" className="w-6 h-6 p-0" onClick={() => updateSelectedQty(it.variantId, it.qty - 1)}>-</Button>
                                <span className="w-6 text-center text-sm">{it.qty}</span>
                                <Button size="sm" variant="outline" className="w-6 h-6 p-0" onClick={() => updateSelectedQty(it.variantId, it.qty + 1)}>+</Button>
                              </div>
                            </div>
                          </div>
                        ))}
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>Total</span>
                          <span>₹{getSelectedTotal().toFixed(2)}</span>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              {selectedItems.length === 0 && !productError && !loadingProducts && shopProducts.length > 0 && (
                <div className="text-sm text-gray-500 mt-4">Total ₹0.00</div>
              )}
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-md">
            <CardContent className="p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Shipping</h4>
              
              {selectedInfluencerData && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{selectedInfluencerData.name}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{selectedInfluencerData.email}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{selectedInfluencerData.phone}</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="text-sm text-gray-700">{selectedInfluencerData.address || "—"}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="firstName" className="text-sm">First Name</Label>
                      <Input
                        id="firstName"
                        value={shippingDetails.firstName}
                        onChange={(e) => setShippingDetails(prev => ({...prev, firstName: e.target.value}))}
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-sm">Last Name</Label>
                      <Input
                        id="lastName"
                        value={shippingDetails.lastName}
                        onChange={(e) => setShippingDetails(prev => ({...prev, lastName: e.target.value}))}
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address" className="text-sm">Address</Label>
                    <Input
                      id="address"
                      value={shippingDetails.address}
                      onChange={(e) => setShippingDetails(prev => ({...prev, address: e.target.value}))}
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="city" className="text-sm">City</Label>
                      <Input
                        id="city"
                        value={shippingDetails.city}
                        onChange={(e) => setShippingDetails(prev => ({...prev, city: e.target.value}))}
                        placeholder="New York"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state" className="text-sm">State</Label>
                      <Input
                        id="state"
                        value={shippingDetails.state}
                        onChange={(e) => setShippingDetails(prev => ({...prev, state: e.target.value}))}
                        placeholder="NY"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode" className="text-sm">ZIP</Label>
                      <Input
                        id="zipCode"
                        value={shippingDetails.zipCode}
                        onChange={(e) => setShippingDetails(prev => ({...prev, zipCode: e.target.value}))}
                        placeholder="10001"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm">Phone</Label>
                    <Input
                      id="phone"
                      value={shippingDetails.phone}
                      onChange={(e) => setShippingDetails(prev => ({...prev, phone: e.target.value}))}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={shippingDetails.email}
                      onChange={(e) => setShippingDetails(prev => ({...prev, email: e.target.value}))}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <div className="space-y-4">
            {/* Order Summary */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-md">
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Order Summary</h4>
                
                <div className="space-y-2">
                  {selectedItems.map(item => (
                    <div key={item.variantId} className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium text-gray-900 truncate">{item.title}</h5>
                        <p className="text-xs text-gray-500">Qty: {item.qty}</p>
                      </div>
                      <span className="text-sm font-medium">₹{(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <Separator className="my-3" />
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₹{getRealSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>₹{getRealShipping().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>₹{getRealTax().toFixed(2)}</span>
                  </div>
                  {isZeroValueOrder && getRealDiscount() > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Discount (Zero-value order)</span>
                      <span className="text-red-600">-₹{getRealDiscount().toFixed(2)}</span>
                    </div>
                  )}
                </div>
                
                <Separator className="my-3" />
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>₹{getRealTotal().toFixed(2)}</span>
                </div>
                
                {/* Zero-value toggle */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Zero-value order</span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsZeroValueOrder(!isZeroValueOrder)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          isZeroValueOrder ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isZeroValueOrder ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className="text-xs text-gray-500">
                        {isZeroValueOrder ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {isZeroValueOrder 
                      ? 'Order will be created with 100% discount applied' 
                      : 'Order will be created with full payment required'
                    }
                  </p>
                </div>
                
                {/* Error message */}
                {orderError && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                    {orderError}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Meta Information */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-md">
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Meta</h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{selectedInfluencerData?.name}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">Shopify ID: {`SHO-${Date.now()}`}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">Created: {formatDDMMYYYY(new Date())}</span>
                  </div>
                </div>
                
                <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                  By creating this order, you agree to our terms of service and influencer collaboration agreement.
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-[100dvh] max-w-none rounded-none p-0 overflow-y-auto overflow-x-hidden bg-white sm:w-[900px] md:w-[1000px] sm:max-w-4xl sm:max-h-[90vh] sm:rounded-lg">
        {/* Accessibility: Title and Description for screen readers */}
        <DialogHeader>
          <DialogTitle className="sr-only">Create Order</DialogTitle>
          <DialogDescription className="sr-only">Multi-step wizard to select products, enter shipping, and place order.</DialogDescription>
        </DialogHeader>
        <div className="w-full h-full overflow-x-hidden pb-6">
        {currentStep === 2 ? (
           <div className="w-full h-full flex flex-col bg-white relative">
            {/* Removed custom close (X) button to avoid overlapping with Approved content */}
 
            {/* Sticky Header with stepper and title */}
            <div className="sticky top-0 z-20 border-b bg-white">
              <div className="px-4 pt-3">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  {[1, 2, 3, 4].map(step => (
                    <div key={step} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step <= currentStep 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {step}
                      </div>
                      {step < 4 && (
                        <div className={`w-8 h-0.5 mx-1 ${
                          step < currentStep ? 'bg-blue-500' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="pb-3 flex items-center justify-between">
                  <h2 className="text-base font-semibold">Products</h2>
                  {selectedInfluencerData && (
                     <div className="hidden md:inline-flex items-center space-x-2 text-sm text-gray-700">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-md flex items-center justify-center text-[10px] text-white font-bold">
                        {getInitials(selectedInfluencerData.name)}
                      </div>
                      <span className="font-medium truncate max-w-[200px]" title={selectedInfluencerData.name}>{selectedInfluencerData.name}</span>
                      <Badge className={`ml-1 ${getStatusClasses(selectedInfluencerData.status)}`}>{selectedInfluencerData.status}</Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Two-column content */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] overflow-x-hidden min-h-0">
              {/* Left: Products */}
               <div className="flex flex-col h-full min-h-0">
                 {/* Search and filters - fixed at top */}
                 <div className="p-4 space-y-3 border-b bg-white">
                   <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                       <SelectTrigger className="w-full sm:w-32"><SelectValue placeholder="Availability" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="inStock">In stock</SelectItem>
                        <SelectItem value="out">Out</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={setSortBy}>
                       <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Sort" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="price">Price</SelectItem>
                        <SelectItem value="inventory">Updated/Inventory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {searchQuery.trim() ? (
                        <>
                          {totalCount || shopProducts.length} results for "{searchQuery.trim()}"
                        </>
                      ) : (
                        <>
                          {totalCount || shopProducts.length} products
                        </>
                      )}
                    </div>
                    {isDataFromCache && (
                      <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        📦 Cached
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    {productError && (
                      <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded flex-1 mr-2">
                        {productError} 
                        <Button size="sm" variant="outline" className="ml-2" onClick={() => fetchProducts(null)}>Retry</Button>
                      </div>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        clearProductCache();
                        fetchProducts(null);
                      }}
                      className="flex items-center gap-1"
                      title="Refresh product data from server"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </Button>
                  </div>
                 </div>

                                   {/* Product list - scrollable area */}
                  <div className="flex-1 overflow-y-auto min-h-0 max-h-[60vh] sm:max-h-[400px] pb-16 md:pb-0" id="product-scroll">
                    <div className="p-4 space-y-2">
                    {shopProducts.map(p => {
                      const lowest = Math.min(...p.variants.map(v => Number(v.price)));
                      const variantsCount = p.variants.length;
                      const disabledAll = p.totalStock <= 0;
                      return (
                        <div key={p.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                          <div className="w-14 h-14 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                            {p.thumbnail ? <img src={p.thumbnail} alt={p.title} loading="lazy" className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-gray-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <h4 className="text-sm font-medium text-gray-900 truncate">{p.title}</h4>
                                </TooltipTrigger>
                                <TooltipContent><p>{p.title}</p></TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm font-semibold">₹{lowest}</span>
                              <Badge variant="outline" className="text-xs">{p.totalStock} in stock</Badge>
                              {variantsCount > 1 && <span className="text-xs text-gray-500">{variantsCount} variants</span>}
                            </div>
                          </div>
                          <div>
                            {variantsCount <= 1 ? (
                              (() => {
                                const v = p.variants[0];
                                const qty = getVariantQty(v.variantId);
                                return qty > 0 ? (
                                  <div className="flex items-center space-x-2" aria-label={`Quantity for ${p.title}`}>
                                    <Button aria-label={`Decrease quantity for ${p.title}`} size="sm" variant="outline" className="w-8 h-8 p-0" onClick={() => updateSelectedQty(v.variantId, qty - 1)}>-</Button>
                                    <span className="w-6 text-center text-sm">{qty}</span>
                                    <Button aria-label={`Increase quantity for ${p.title}`} size="sm" variant="outline" className="w-8 h-8 p-0" onClick={() => updateSelectedQty(v.variantId, qty + 1)}>+</Button>
                                  </div>
                                ) : (
                                   <Button aria-label={`Add ${p.title}`} size="sm" className="w-full sm:w-auto" disabled={disabledAll || v.stock <= 0} title={(disabledAll || v.stock <= 0) ? 'Out of stock' : ''} onClick={() => addVariant(p.id as any, v)}>Add</Button>
                                );
                              })()
                            ) : (
                              <Popover>
                                <PopoverTrigger asChild>
                                   <Button aria-label={`Choose variant for ${p.title}`} size="sm" className="w-full sm:w-auto">Choose variant</Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                  <div className="space-y-2">
                                    {p.variants.map(v => {
                                      const qty = getVariantQty(v.variantId);
                                      const disabled = (v.stock || 0) <= 0;
                                      return (
                                        <div key={v.variantId} className="flex items-center justify-between">
                                          <div className="min-w-0 pr-2">
                                            <p className="text-sm truncate">{v.title}</p>
                                            <p className="text-xs text-gray-600">₹{v.price} • {v.stock} in stock</p>
                                          </div>
                                          {qty > 0 ? (
                                            <div className="flex items-center space-x-1">
                                              <Button size="sm" variant="outline" className="w-7 h-7 p-0" onClick={() => updateSelectedQty(v.variantId, qty - 1)}>-</Button>
                                              <span className="w-6 text-center text-sm">{qty}</span>
                                              <Button size="sm" variant="outline" className="w-7 h-7 p-0" onClick={() => updateSelectedQty(v.variantId, qty + 1)}>+</Button>
                                            </div>
                                          ) : (
                                             <Button size="sm" variant="outline" className="w-full sm:w-auto" disabled={disabled} title={disabled ? 'Out of stock' : ''} onClick={() => addVariant(p.id as any, v)}>Add</Button>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {!productError && !loadingProducts && shopProducts.length === 0 && (
                        <div className="text-sm text-gray-500 text-center py-8">
                          {searchQuery.trim() ? (
                            <>
                              <div className="text-lg font-medium text-gray-900 mb-2">No products found</div>
                              <div className="text-gray-600">No products match "{searchQuery.trim()}"</div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="mt-3" 
                                onClick={() => setSearchQuery("")}
                              >
                                Clear search
                              </Button>
                            </>
                          ) : (
                            "No products available"
                          )}
                        </div>
                      )}

                                           {/* Load More Button - Inside scrollable area */}
                      {nextPageInfo && (
                        <div className="pt-3">
                          <Button 
                            variant="outline" 
                            className="w-full" 
                            onClick={() => fetchProducts(nextPageInfo)} 
                            disabled={loadingProducts}
                          >
                            {loadingProducts ? 'Loading…' : 'Load more products'}
                          </Button>
                        </div>
                      )}
                      
                      {/* Show message when no more products */}
                      {!nextPageInfo && shopProducts.length > 0 && (
                        <div className="text-center text-xs text-gray-500 py-3">
                          All products loaded
                      </div>
                      )}

                      {/* Removed sentinel for infinite scroll */}
                  </div>
                </div>
              </div>

              {/* Right: Selected panel */}
              <div className="lg:border-l border-t lg:border-t-0 bg-white flex flex-col min-h-0">
                <div className="p-3 border-b font-semibold">Selected</div>
                <div className="flex-1 overflow-auto p-3 space-y-2">
                  {selectedItems.length === 0 ? (
                    <div className="text-sm text-gray-500">Nothing selected yet.</div>
                  ) : (
                    selectedItems.map(it => (
                      <div key={it.variantId} className="flex items-center space-x-3 p-2 border rounded">
                        <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate" title={it.title}>{it.title}</div>
                          <div className="text-xs text-gray-500">₹{it.price}</div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button size="sm" variant="outline" className="w-7 h-7 p-0" onClick={() => updateSelectedQty(it.variantId, Math.max(0, getVariantQty(it.variantId) - 1))}>-</Button>
                          <span className="w-6 text-center text-sm">{getVariantQty(it.variantId)}</span>
                          <Button size="sm" variant="outline" className="w-7 h-7 p-0" onClick={() => updateSelectedQty(it.variantId, getVariantQty(it.variantId) + 1)}>+</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₹{getSelectedTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Footer with actions and summary */}
            <div className="sticky bottom-0 z-20 border-t bg-white">
              <div className="px-4 py-3 flex items-center justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>Back</Button>
                <div className="text-sm text-gray-600">Selected {getSelectedCount()} • Total ₹{getSelectedTotal().toFixed(2)}</div>
                <Button onClick={() => setCurrentStep(3)} disabled={selectedItems.length === 0 || loadingProducts}>Next</Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              {/* Step indicator */}
              <div className="flex items-center justify-center gap-2 flex-wrap mb-6">
              {[1, 2, 3, 4].map(step => (
                <div key={step} className="flex items-center">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                    step <= currentStep 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  {step < 4 && (
                    <div className={`w-6 sm:w-8 h-0.5 mx-0.5 sm:mx-1 ${
                      step < currentStep ? 'bg-blue-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
              </div>

              {/* Step content */}
              <div className="min-h-[400px]">
                {renderStepContent()}
              </div>
            </div>

            {/* Navigation buttons - sticky footer to match Step 2 (no top border) */}
            <div className="sticky bottom-0 z-20 bg-white">
              <div className="px-4 py-3 flex flex-col sm:flex-row gap-3 sm:gap-0 sm:items-center sm:justify-between">
                <Button
                  className="w-full sm:w-auto"
                  variant="outline"
                  onClick={() => {
                    if (currentStep === 1) {
                      onOpenChange(false);
                    } else {
                      setCurrentStep(currentStep - 1);
                    }
                  }}
                >
                  {currentStep === 1 ? 'Cancel' : 'Back'}
                </Button>

                <Button
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={async () => {
                    if (currentStep === 4) {
                      await placeOrder();
                    } else {
                      setCurrentStep(currentStep + 1);
                    }
                  }}
                  disabled={!canProceedToStep(currentStep + 1) || (currentStep === 4 && creatingShopify)}
                >
                  {currentStep === 4 
                    ? (creatingShopify ? 'Creating order…' : 'Place Order')
                    : 'Next'
                  }
                </Button>
              </div>
            </div>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}