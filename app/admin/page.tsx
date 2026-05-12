'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, courses: 0, today: 0 });

  useEffect(() => {
    fetch('/api/admin/stats').then(res => res.json()).then(setStats);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--accent)' }}>Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <div className="text-3xl mb-2">👨‍🎓</div>
          <div className="text-2xl font-bold">{stats.students}</div>
          <div className="text-sm opacity-70">Total Students</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl mb-2">📚</div>
          <div className="text-2xl font-bold">{stats.courses}</div>
          <div className="text-sm opacity-70">Active Courses</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-2xl font-bold">{stats.today}</div>
          <div className="text-sm opacity-70">Today's Attendance</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/students" className="card text-center hover:opacity-80">
          <div className="text-2xl mb-2">➕</div>
          <div className="font-semibold">Manage Students</div>
          <div className="text-xs opacity-70">Add, edit, or remove students</div>
        </Link>
        <Link href="/admin/courses" className="card text-center hover:opacity-80">
          <div className="text-2xl mb-2">📖</div>
          <div className="font-semibold">Manage Courses</div>
          <div className="text-xs opacity-70">Create courses and enroll students</div>
        </Link>
        <Link href="/admin/reports" className="card text-center hover:opacity-80">
          <div className="text-2xl mb-2">📊</div>
          <div className="font-semibold">Attendance Reports</div>
          <div className="text-xs opacity-70">View and export attendance data</div>
        </Link>
      </div>
    </div>
  );
}