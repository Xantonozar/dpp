'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAllPassports, fetchPassportsFromApi } from '@/lib/passport-data';

export default function DPPIndexPage() {
  const router = useRouter();

  useEffect(() => {
    fetchPassportsFromApi().then((res) => {
      if (res.passports && res.passports.length > 0) {
        router.replace(`/dpp/${res.passports[0].general?.projectId}`);
      } else {
        const list = getAllPassports();
        if (list.length > 0) {
          router.replace(`/dpp/${list[0].general?.projectId}`);
        } else {
          router.replace('/');
        }
      }
    }).catch(() => {
      const list = getAllPassports();
      if (list.length > 0) {
        router.replace(`/dpp/${list[0].general?.projectId}`);
      } else {
        router.replace('/');
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F1EA]">
      <div className="text-center p-8">
        <div className="w-10 h-10 border-2 border-[#2E6B4F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted text-sm font-medium">Opening Digital Product Passport...</p>
      </div>
    </div>
  );
}
