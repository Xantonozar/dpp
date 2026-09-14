'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAllPassports } from '@/lib/passport-data';

export default function DPPIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const list = getAllPassports();
    const targetId = list[0]?.general?.projectId || '151546';
    router.replace(`/dpp/${targetId}`);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="text-center p-8">
        <div className="w-10 h-10 border-2 border-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted text-sm font-medium">Loading Digital Product Passport...</p>
      </div>
    </div>
  );
}
