'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check');
        const data = await res.json();
        setIsLoggedIn(data.authenticated);
        setIsAdmin(data.user?.role === 'admin');
      } catch (error) {
        setIsLoggedIn(false);
      }
    };
    checkAuth();
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50" style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🎓</span>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--accent)' }}>OXFORD GROUP OF COLLEGES</h1>
              <p className="text-xs opacity-70">Attendance System</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isLoggedIn ? (
              <Link href="/admin" className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--accent)', color: '#0a1628' }}>
                Dashboard
              </Link>
            ) : (
              <Link href="/admin/login" className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--accent)', color: '#0a1628' }}>
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="text-7xl mb-6">🚀</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--accent)' }}>
            Smart Attendance System
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Face recognition based attendance tracking with real-time parent notifications
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10" style={{ color: 'var(--accent)' }}>Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="text-4xl mb-3 text-center">😊</div>
              <h3 className="font-semibold mb-2 text-center">Face Recognition</h3>
              <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>Fast and accurate face detection at school gate</p>
            </div>
            <div className="p-6 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="text-4xl mb-3 text-center">📧</div>
              <h3 className="font-semibold mb-2 text-center">Instant Alerts</h3>
              <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>Parents receive email when child arrives</p>
            </div>
            <div className="p-6 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="text-4xl mb-3 text-center">📱</div>
              <h3 className="font-semibold mb-2 text-center">WhatsApp Ready</h3>
              <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>Optional WhatsApp notifications</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10" style={{ color: 'var(--accent)' }}>Quick Access</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Gate Kiosk */}
            <div className="p-5 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="flex items-start gap-4">
                <div className="text-3xl">🎥</div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Gate Kiosk</h3>
                  <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>Face recognition at school entrance</p>
                  <Link href="/kiosk/gate" className="block w-full text-center px-4 py-2 rounded-lg font-semibold" style={{ background: 'var(--accent)', color: '#0a1628' }}>
                    Open Kiosk →
                  </Link>
                </div>
              </div>
            </div>

            {/* Student Management */}
            <div className="p-5 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="flex items-start gap-4">
                <div className="text-3xl">👨‍🎓</div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Student Management</h3>
                  <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>Add, edit, and manage students</p>
                  {isLoggedIn && isAdmin ? (
                    <Link href="/admin" className="block w-full text-center px-4 py-2 rounded-lg font-semibold" style={{ background: 'var(--accent)', color: '#0a1628' }}>
                      Manage Students →
                    </Link>
                  ) : (
                    <Link href="/admin/login" className="block w-full text-center px-4 py-2 rounded-lg font-semibold border" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                      Admin Login →
                    </Link>
                  )}
                </div>
              </div>
            </div>



            {/* Parent Portal */}
            <div className="p-5 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="flex items-start gap-4">
                <div className="text-3xl">👨‍👩‍👧</div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Parent Portal</h3>
                  <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>Check your child's attendance</p>
                  <Link href="/parent-attendance" className="block w-full text-center px-4 py-2 rounded-lg font-semibold border" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                    View Attendance →
                  </Link>
                </div>
              </div>
            </div>

            {/* QR Codes */}
            <div className="p-5 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="flex items-start gap-4">
                <div className="text-3xl">📱</div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">WhatsApp QR Codes</h3>
                  <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>Generate QR for parent subscription</p>
                  {isLoggedIn && isAdmin ? (
                    <Link href="/admin/qr" className="block w-full text-center px-4 py-2 rounded-lg font-semibold border" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                      Generate QR →
                    </Link>
                  ) : (
                    <button disabled className="block w-full text-center px-4 py-2 rounded-lg font-semibold border opacity-50" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                      Login to Access
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Reports */}
            <div className="p-5 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="flex items-start gap-4">
                <div className="text-3xl">📊</div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Attendance Reports</h3>
                  <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>View daily attendance records</p>
                  {isLoggedIn && isAdmin ? (
                    <Link href="/admin/attendance" className="block w-full text-center px-4 py-2 rounded-lg font-semibold border" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                      View Reports →
                    </Link>
                  ) : (
                    <button disabled className="block w-full text-center px-4 py-2 rounded-lg font-semibold border opacity-50" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                      Login to Access
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center border-t" style={{ borderColor: 'var(--border)' }}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>© 2024 DIT School Attendance System</p>
        <p className="text-xs opacity-50 mt-2" style={{ color: 'var(--text-secondary)' }}>Powered by Face Recognition | Instant Notifications</p>
      </footer>
    </div>
  );
}