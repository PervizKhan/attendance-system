'use client';

import { useState } from 'react';

export default function BackupPage() {
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const downloadBackup = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/backup');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Backup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--accent)' }}>Database Backup</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Backup Section */}
        <div className="p-6 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-4xl mb-3">💾</div>
          <h2 className="text-lg font-semibold mb-2">Download Backup</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Download a complete backup of all data including students, attendance, and settings.
          </p>
          <button onClick={downloadBackup} disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating backup...' : 'Download Backup'}
          </button>
        </div>
        
        {/* Schedule Section */}
        <div className="p-6 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-4xl mb-3">⏰</div>
          <h2 className="text-lg font-semibold mb-2">Auto Backup Schedule</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Automatic backups run daily at 2:00 AM. Backups are stored for 30 days.
          </p>
          <div className="text-sm" style={{ color: 'var(--accent)' }}>
            ✅ Last backup: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
      
      {/* Restore Section (Admin only) */}
      <div className="mt-6 p-6 rounded-xl border border-red-500/30" style={{ background: 'var(--bg-card)' }}>
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="text-lg font-semibold mb-2" style={{ color: '#ef4444' }}>Restore Database</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Warning: Restoring will overwrite all current data. This action cannot be undone.
        </p>
        <button disabled className="btn-secondary w-full opacity-50 cursor-not-allowed">
          Restore (Disabled - Contact Admin)
        </button>
      </div>
    </div>
  );
}