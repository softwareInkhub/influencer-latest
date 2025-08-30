import { useState, useEffect, useCallback } from 'react';

interface ShipmentData {
  status: string;
  trackingNumber: string | null;
  carrier: string | null;
  trackingUrl: string | null;
  estimatedDelivery: string | null;
  deliveryHistory: Array<{
    status: string;
    timestamp: string;
    location?: string;
    description?: string;
  }>;
  lastUpdated: string | null;
  orderStatus: string;
}

interface UseShipmentDataReturn {
  shipmentData: ShipmentData | null;
  isLoading: boolean;
  error: string | null;
  refreshShipmentData: () => void;
}

export function useShipmentData(orderId: string | null): UseShipmentDataReturn {
  const [shipmentData, setShipmentData] = useState<ShipmentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShipmentData = useCallback(async () => {
    if (!orderId) {
      setShipmentData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}/shipment`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch shipment data: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.shipment) {
        setShipmentData(data.shipment);
      } else {
        throw new Error('Invalid shipment data received');
      }
    } catch (err) {
      console.error('Error fetching shipment data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch shipment data');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  const refreshShipmentData = useCallback(() => {
    fetchShipmentData();
  }, [fetchShipmentData]);

  // Initial fetch
  useEffect(() => {
    fetchShipmentData();
  }, [fetchShipmentData]);

  // Auto-refresh disabled - only manual refresh
  // useEffect(() => {
  //   if (!orderId) return;

  //   const interval = setInterval(() => {
  //     fetchShipmentData();
  //   }, autoRefreshInterval);

  //   return () => clearInterval(interval);
  // }, [orderId, autoRefreshInterval, fetchShipmentData]);

  return {
    shipmentData,
    isLoading,
    error,
    refreshShipmentData
  };
}
