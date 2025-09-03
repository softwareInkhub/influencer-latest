'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ContentTab from "@/app/components/content-tab";

export default function ContentPage() {
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
    <ContentTab />
  );
}
