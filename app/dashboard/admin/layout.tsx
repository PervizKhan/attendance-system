'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check');
        const data = await res.json();
        
        console.log('Auth check result:', data); // Debug log
        
        if (!data.authenticated) {
          console.log('Not authenticated, redirecting to login');
          router.push('/admin/login');
          return;
        }
        
        if (data.user?.role !== 'admin') {
          console.log('Not admin, redirecting to student dashboard');
          router.push('/dashboard');
          return;
        }
        
        setIsAdmin(true);
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  // Email scheduler
  useEffect(() => {
    if (!isAdmin) return;
    
    const sendBatchEmails = async () => {
      try {
        const res = await fetch('/api/cron/send-attendance-emails');
        const data = await res.json();
        console.log('📧 Batch email:', data);
      } catch (error) {
        console.error('Batch email error:', error);
      }
    };
    
    sendBatchEmails();
    const interval = setInterval(sendBatchEmails, 60 * 1000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center" style={{ color: 'var(--text-secondary)' }}>Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Admin Header */}
      <div className="border-b p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold" style={{ color: 'var(--accent)' }}>Admin Dashboard</h1>
          <Link href="/" className="px-3 py-1 rounded-lg text-sm border" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
            Home
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-4 pt-4">
        <div className="flex gap-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <Link
            href="/dashboard/admin"
            className={`px-4 py-2 ${
              pathname === '/dashboard/admin'
                ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]'
                : 'opacity-70'
            }`}
          >
            Students
          </Link>
          <Link
            href="/dashboard/admin/qr"
            className={`px-4 py-2 ${
              pathname === '/dashboard/admin/qr'
                ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]'
                : 'opacity-70'
            }`}
          >
            QR Codes
          </Link>
        </div>
      </div>

      {/* Page Content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}