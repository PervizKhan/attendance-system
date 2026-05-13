'use client';

import { useState } from 'react';

interface BatchEmailResult {
  error?: string;
  found?: number;
  sent?: number;
  lateCount?: number;
}

interface MonthlyReportResult {
  error?: string;
  month?: string;
  totalStudents?: number;
  sent?: number;
  failed?: number;
}

export default function ActionsPage() {
  const [sending, setSending] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [result, setResult] = useState<BatchEmailResult | null>(null);
  const [reportResult, setReportResult] = useState<MonthlyReportResult | null>(null);

  const sendBatchEmails = async () => {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/cron/send-attendance-emails');
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to send emails' });
    } finally {
      setSending(false);
    }
  };

  const sendMonthlyReports = async () => {
    setGeneratingReport(true);
    setReportResult(null);
    try {
      const res = await fetch('/api/cron/monthly-report');
      const data = await res.json();
      setReportResult(data);
    } catch (error) {
      setReportResult({ error: 'Failed to send monthly reports' });
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--accent)' }}>Admin Actions</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily Batch Emails */}
        <div className="p-5 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-3xl mb-3">📧</div>
          <h2 className="text-lg font-semibold mb-2">Send Daily Attendance Emails</h2>
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            Manually trigger batch email notifications for today's attendance.
            <br />
            <span className="text-xs opacity-70">Parents will receive one email per child with today's status.</span>
          </p>
          <button 
            onClick={sendBatchEmails} 
            disabled={sending}
            className="px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50 w-full"
            style={{ background: 'var(--accent)', color: '#0a1628' }}
          >
            {sending ? 'Sending...' : '📧 Send Daily Emails'}
          </button>
          
          {result && (
            <div className="mt-4">
              <div className={`p-3 rounded-lg text-xs overflow-auto ${result.error ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                {result.error ? (
                  <span>❌ {result.error}</span>
                ) : (
                  <div>
                    <strong>✅ Emails Sent!</strong><br />
                    Found: {result.found} records<br />
                    Sent: {result.sent} emails<br />
                    Late arrivals: {result.lateCount || 0}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Monthly Reports */}
        <div className="p-5 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-3xl mb-3">📊</div>
          <h2 className="text-lg font-semibold mb-2">Send Monthly Reports</h2>
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            Generate and send monthly attendance reports to all parents.
            <br />
            <span className="text-xs opacity-70">Includes summary for last month with present/late/absent counts.</span>
          </p>
          <button 
            onClick={sendMonthlyReports} 
            disabled={generatingReport}
            className="px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50 w-full"
            style={{ background: 'var(--accent)', color: '#0a1628' }}
          >
            {generatingReport ? 'Generating...' : '📊 Send Monthly Reports'}
          </button>
          
          {reportResult && (
            <div className="mt-4">
              <div className={`p-3 rounded-lg text-xs overflow-auto ${reportResult.error ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                {reportResult.error ? (
                  <span>❌ {reportResult.error}</span>
                ) : (
                  <div>
                    <strong>✅ Monthly Reports Sent!</strong><br />
                    Month: {reportResult.month}<br />
                    Total Students: {reportResult.totalStudents}<br />
                    Sent: {reportResult.sent}<br />
                    Failed: {reportResult.failed}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Info Section */}
      <div className="mt-6 p-4 rounded-lg border border-blue-500/30" style={{ background: 'var(--bg-card)' }}>
        <h3 className="font-semibold mb-2" style={{ color: 'var(--accent)' }}>ℹ️ Auto-Schedule Information</h3>
        <ul className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
          <li>📧 <strong>Daily Attendance Emails:</strong> Automatically sent every minute (only when admin panel is open)</li>
          <li>📊 <strong>Monthly Reports:</strong> Can be scheduled via cron job or run manually here</li>
          <li>⏰ <strong>Late Cutoff:</strong> Students marked after 8:30 AM are flagged as "Late"</li>
          <li>📅 <strong>Holidays:</strong> No emails sent on holidays (configure in Holidays page)</li>
        </ul>
      </div>
    </div>
  );
}