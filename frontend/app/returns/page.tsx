'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Returns() {
  const router = useRouter();
  useEffect(() => { router.replace('/returns/list'); }, [router]);
  return null;
}
