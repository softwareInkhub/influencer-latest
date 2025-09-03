'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import OrdersTab from "@/app/components/orders-tab";

export default function OrdersPage() {
  const router = useRouter();

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push(process.env.NEXT_PUBLIC_BASE_URL || '/');
      return;
    }
  }, [router]);

  return (
    <OrdersTab />
  );
}
