// app/dashboard/admin/absent-today/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getPKTDateString } from '@/lib/date';

interface SentRow {
  _id: string;
  studentId: string;
  studentName: string;
  fatherName: string;
  className: string;
  parentPhone: string;
  sentAt: string;
}

interface FailedRow {
  _id: string;
  studentId: string;
  studentName: string;
  fatherName: string;
  className: string;
  parentPhone: string;
  reason: string;
}

interface ReportData {
  totalAbsent: number;
  sentCount: number;
  failedCount: number;
  sent: SentRow[];
  failed: FailedRow[];
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function AbsentTodayPage() {
  const [date, setDate] = useState(() => getPKTDateString());
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReportData | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      setStatus('loading');
      setError(null);
      try {
        const res = await fetch(
          `/api/admin/absent-today?date=${encodeURIComponent(date)}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Request failed (${res.status})`);
        }

        const json: ReportData = await res.json();
        if (cancelled) return;
        setData(json);
        setStatus('success');
      } catch (err) {
        if (cancelled) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [date, refreshKey]);

  const maskPhone = (phone: string) => {
    if (!phone) return '—';
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 6) return phone;
    return `${digits.slice(0, 4)}****${digits.slice(-3)}`;
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
          Absentee SMS Log
        </h1>
        <div className="flex items-center gap-2">
          <label htmlFor="report-date" className="text-sm opacity-70">
            Date
          </label>
          <input
            id="report-date"
            type="date"
            className="input w-48"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="px-3 py-1 rounded-lg text-sm border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? '…' : 'Refresh'}
          </button>
        </div>
      </div>

      {status === 'loading' && (
        <div className="text-center py-8 opacity-60">Loading...</div>
      )}

      {status === 'error' && (
        <div className="card text-center py-6" style={{ color: '#ef4444' }}>
          Failed to load: {error}
        </div>
      )}

      {status === 'success' && data && (
        <>
          <div className="stats-grid mb-6">
            <div className="stat-card">
              <h3 className="text-sm opacity-70">Total Absent</h3>
              <p
                className="text-2xl font-bold mt-2"
                style={{ color: 'var(--accent)' }}
              >
                {data.totalAbsent}
              </p>
            </div>
            <div className="stat-card">
              <h3 className="text-sm opacity-70">SMS Sent</h3>
              <p className="text-2xl font-bold mt-2 text-green-500">
                {data.sentCount}
              </p>
            </div>
            <div className="stat-card">
              <h3 className="text-sm opacity-70">Not Sent</h3>
              <p className="text-2xl font-bold mt-2 text-red-500">
                {data.failedCount}
              </p>
            </div>
          </div>

          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4 text-green-500">
              SMS Sent Successfully ({data.sentCount})
            </h2>
            {data.sent.length === 0 ? (
              <div className="text-center py-4 opacity-60 text-sm">
                No SMS sent.
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Father</th>
                      <th>Class</th>
                      <th>Parent Phone</th>
                      <th>Sent At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sent.map((row) => (
                      <tr key={row._id}>
                        <td>{row.studentName}</td>
                        <td>{row.fatherName}</td>
                        <td>{row.className}</td>
                        <td className="font-mono text-xs" title={row.parentPhone}>
                          {maskPhone(row.parentPhone)}
                        </td>
                        <td className="text-xs opacity-70">
                          {new Date(row.sentAt).toLocaleTimeString('en-PK', {
                            timeZone: 'Asia/Karachi',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-red-500">
              Not Sent ({data.failedCount})
            </h2>
            {data.failed.length === 0 ? (
              <div className="text-center py-4 opacity-60 text-sm">
                All absent students were notified.
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Father</th>
                      <th>Class</th>
                      <th>Parent Phone</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.failed.map((row) => (
                      <tr key={row._id}>
                        <td>{row.studentName}</td>
                        <td>{row.fatherName}</td>
                        <td>{row.className}</td>
                        <td className="font-mono text-xs" title={row.parentPhone}>
                          {maskPhone(row.parentPhone)}
                        </td>
                        <td className="text-xs text-red-500">{row.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}