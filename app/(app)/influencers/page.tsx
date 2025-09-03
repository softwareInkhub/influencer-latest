'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import InfluencersTab from "@/app/components/influencers-tab";

export default function InfluencersPage() {
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
    <InfluencersTab />
  );
}
