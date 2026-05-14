'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // Check if we're on the login page
    const isLoginPage = pathname === '/admin/login';

    useEffect(() => {
        // Skip auth check for login page
        if (isLoginPage) {
            setLoading(false);
            return;
        }

        const checkAuth = async () => {
            try {
                const res = await fetch('/api/auth/check');
                const data = await res.json();

                if (!data.authenticated) {
                    router.push('/admin/login');
                    return;
                }

                if (data.user?.role !== 'admin') {
                    router.push('/dashboard');
                    return;
                }

                setIsAdmin(true);
            } catch (error) {
                router.push('/admin/login');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router, isLoginPage]);

    // Email scheduler (only for admin pages, not login)
    useEffect(() => {
        if (!isAdmin || isLoginPage) return;

        const sendBatchEmails = async () => {
            try {
                const res = await fetch('/api/cron/send-attendance-emails');
                const data = await res.json();
                if (data.found > 0) {
                    console.log(`📧 Sent ${data.sent} emails`);
                }
            } catch (error) {
                console.error('Batch email error:', error);
            }
        };

        sendBatchEmails();
        const interval = setInterval(sendBatchEmails, 60 * 1000);
        return () => clearInterval(interval);
    }, [isAdmin, isLoginPage]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <div className="text-center" style={{ color: 'var(--text-secondary)' }}>Loading...</div>
            </div>
        );
    }

    // For login page, just render children without admin header
    if (isLoginPage) {
        return <>{children}</>;
    }

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
            {/* Admin Header */}
            <div className="border-b p-4 flex justify-between items-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <h1 className="text-xl font-bold" style={{ color: 'var(--accent)' }}>Admin Panel</h1>
                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <Link href="/" className="px-3 py-1 rounded-lg text-sm border" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                        Home
                    </Link>
                    <button
                        onClick={async () => {
                            await fetch('/api/admin/logout', { method: 'POST' });
                            window.location.href = '/admin/login';
                        }}
                        className="px-3 py-1 rounded-lg text-sm border hover:border-red-500 transition"
                        style={{ borderColor: 'var(--border)', color: '#ef4444' }}
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Navigation Tabs - Mobile Friendly */}
<div className="px-4 pt-4">
  <div className="flex gap-2 overflow-x-auto pb-2 -mb-0.5 scrollbar-thin" style={{ borderColor: 'var(--border)', WebkitOverflowScrolling: 'touch' }}>
    <Link
      href="/admin"
      className={`px-3 py-2 text-sm whitespace-nowrap rounded-t-lg ${
        pathname === '/admin'
          ? 'border-b-2 border-[var(--accent)] text-[var(--accent)] font-medium'
          : 'opacity-70'
      }`}
    >
      👨‍🎓
    </Link>
    <Link
      href="/admin/staff"
      className={`px-3 py-2 text-sm whitespace-nowrap rounded-t-lg ${
        pathname === '/admin/staff'
          ? 'border-b-2 border-[var(--accent)] text-[var(--accent)] font-medium'
          : 'opacity-70'
      }`}
    >
      👨‍🏫
    </Link>
    <Link
      href="/admin/dashboard"
      className={`px-3 py-2 text-sm whitespace-nowrap rounded-t-lg ${
        pathname === '/admin/dashboard'
          ? 'border-b-2 border-[var(--accent)] text-[var(--accent)] font-medium'
          : 'opacity-70'
      }`}
    >
      📊
    </Link>
    <Link
      href="/admin/attendance"
      className={`px-3 py-2 text-sm whitespace-nowrap rounded-t-lg ${
        pathname === '/admin/attendance'
          ? 'border-b-2 border-[var(--accent)] text-[var(--accent)] font-medium'
          : 'opacity-70'
      }`}
    >
      📋
    </Link>
    <Link
      href="/admin/qr"
      className={`px-3 py-2 text-sm whitespace-nowrap rounded-t-lg ${
        pathname === '/admin/qr'
          ? 'border-b-2 border-[var(--accent)] text-[var(--accent)] font-medium'
          : 'opacity-70'
      }`}
    >
      📱
    </Link>
    <Link
      href="/admin/import"
      className={`px-3 py-2 text-sm whitespace-nowrap rounded-t-lg ${
        pathname === '/admin/import'
          ? 'border-b-2 border-[var(--accent)] text-[var(--accent)] font-medium'
          : 'opacity-70'
      }`}
    >
      📥
    </Link>
    <Link
      href="/admin/holidays"
      className={`px-3 py-2 text-sm whitespace-nowrap rounded-t-lg ${
        pathname === '/admin/holidays'
          ? 'border-b-2 border-[var(--accent)] text-[var(--accent)] font-medium'
          : 'opacity-70'
      }`}
    >
      📅
    </Link>
    <Link
      href="/admin/logs"
      className={`px-3 py-2 text-sm whitespace-nowrap rounded-t-lg ${
        pathname === '/admin/logs'
          ? 'border-b-2 border-[var(--accent)] text-[var(--accent)] font-medium'
          : 'opacity-70'
      }`}
    >
      📜
    </Link>
    <Link
      href="/admin/backup"
      className={`px-3 py-2 text-sm whitespace-nowrap rounded-t-lg ${
        pathname === '/admin/backup'
          ? 'border-b-2 border-[var(--accent)] text-[var(--accent)] font-medium'
          : 'opacity-70'
      }`}
    >
      💾
    </Link>
    <Link
      href="/admin/actions"
      className={`px-3 py-2 text-sm whitespace-nowrap rounded-t-lg ${
        pathname === '/admin/actions'
          ? 'border-b-2 border-[var(--accent)] text-[var(--accent)] font-medium'
          : 'opacity-70'
      }`}
    >
      ⚡
    </Link>
    <Link
  href="/admin/admins"
  className={`px-4 py-2 whitespace-nowrap ${
    pathname === '/admin/admins'
      ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]'
      : 'opacity-70'
  }`}
>
  👥 Admins
</Link>
<Link
  href="/admin/face-training"
  className={`px-4 py-2 whitespace-nowrap ${
    pathname === '/admin/face-training'
      ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]'
      : 'opacity-70'
  }`}
>
  🎯 Face Training
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