'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PwaStart() {
  const router = useRouter();
  
  useEffect(() => {
    // Client-side redirect to bypass Chrome's PWA 200 OK requirement
    router.replace('/');
  }, [router]);
  
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
      <img src="/app-logo.png" alt="Logo" style={{ width: 100, height: 100, marginBottom: 20 }} />
      <p>טוען אפליקציה...</p>
    </div>
  );
}
