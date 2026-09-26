// app/admin/actions/page.tsx
'use client';

import { useState } from 'react';

type JsonResponse = Record<string, unknown> | null;

export default function ActionsPage() {
  const [runningDailyTasks, setRunningDailyTasks] = useState(false);
  const [dailyTasksResult, setDailyTasksResult] = useState<JsonResponse>(null);
  const [error, setError] = useState<string | null>(null);

  const runDailyTasks = async () => {
    setRunningDailyTasks(true);
    setDailyTasksResult(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/run-daily-tasks', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Request failed (${res.status})`);
      } else {
        setDailyTasksResult(data);
      }
    } catch {
      setError('Network error');
    } finally {
      setRunningDailyTasks(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--accent)' }}>
        Admin Actions
      </h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          className="p-5 rounded-xl border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="text-3xl mb-3">⏰</div>
          <h2 className="text-lg font-semibold mb-2">Run Daily Tasks</h2>
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            Mark absent students + Send SMS to parents
            <br />
            <span className="text-xs opacity-70">
              Auto-runs every 5 minutes during the morning; Sunday & holidays are skipped
            </span>
          </p>
          <button
            onClick={runDailyTasks}
            disabled={runningDailyTasks}
            className="btn-primary w-full"
          >
            {runningDailyTasks ? 'Running...' : '⏰ Run Daily Tasks'}
          </button>

          {error && (
            <p className="mt-3 text-sm" style={{ color: '#ef4444' }}>
              {error}
            </p>
          )}

          {dailyTasksResult && (
            <pre
              className="mt-4 p-2 rounded text-xs overflow-auto max-h-60"
              style={{ background: 'var(--bg-primary)' }}
            >
              {JSON.stringify(dailyTasksResult, null, 2)}
            </pre>
          )}
        </div>
      </div>

      <div
        className="mt-6 p-4 rounded-lg border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <h3 className="font-semibold mb-2" style={{ color: 'var(--accent)' }}>
          ⏰ Auto-Schedule Information
        </h3>
        <ul className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
          <li>
            ⏰ <strong>Daily Tasks:</strong> Runs every 5 minutes; SMS batches send during the
            morning window. Sunday and holidays are skipped.
          </li>
          <li>📵 <strong>Notifications:</strong> SMS only (no email).</li>
          <li>📅 <strong>Holidays:</strong> No notifications sent on holidays.</li>
        </ul>
      </div>
    </div>
  );
}