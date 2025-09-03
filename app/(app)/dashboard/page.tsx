'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardTab from "@/app/components/dashboard-tab";

export default function DashboardPage() {
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
    <DashboardTab onTabChange={(tab) => {
      // Navigate to different routes based on tab
      switch (tab) {
        case 'influencers':
          router.push('/influencers');
          break;
        case 'orders':
          router.push('/orders');
          break;
        case 'content':
          router.push('/content');
          break;
        case 'messages':
          router.push('/messages');
          break;
        case 'settings':
          router.push('/settings');
          break;
      }
    }} />
  );
}
