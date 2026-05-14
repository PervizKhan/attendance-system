'use client';

import { useState } from 'react';

type JsonResponse = Record<string, unknown> | null;

export default function ActionsPage() {
  const [sending, setSending] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [runningDailyTasks, setRunningDailyTasks] = useState(false);
  const [result, setResult] = useState<JsonResponse>(null);
  const [reminderResult, setReminderResult] = useState<JsonResponse>(null);
  const [dailyTasksResult, setDailyTasksResult] = useState<JsonResponse>(null);

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

  const sendAbsentReminders = async () => {
    setSendingReminders(true);
    setReminderResult(null);
    try {
      const res = await fetch('/api/cron/absent-reminder');
      const data = await res.json();
      setReminderResult(data);
    } catch (error) {
      setReminderResult({ error: 'Failed to send reminders' });
    } finally {
      setSendingReminders(false);
    }
  };

  const runDailyTasks = async () => {
    setRunningDailyTasks(true);
    setDailyTasksResult(null);
    try {
      const res = await fetch('/api/cron/daily-tasks');
      const data = await res.json();
      setDailyTasksResult(data);
    } catch (error) {
      setDailyTasksResult({ error: 'Failed to run daily tasks' });
    } finally {
      setRunningDailyTasks(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--accent)' }}>Admin Actions</h1>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Daily Tasks (Combined) */}
        <div className="p-5 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-3xl mb-3">⏰</div>
          <h2 className="text-lg font-semibold mb-2">Run Daily Tasks</h2>
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            Mark absent students + Send attendance emails + Send absent reminders
            <br />
            <span className="text-xs opacity-70">Auto-runs daily at 10:00 AM</span>
          </p>
          <button 
            onClick={runDailyTasks} 
            disabled={runningDailyTasks}
            className="btn-primary w-full"
          >
            {runningDailyTasks ? 'Running...' : '⏰ Run Daily Tasks'}
          </button>
          {dailyTasksResult && (
            <pre className="mt-4 p-2 rounded text-xs overflow-auto max-h-60" style={{ background: 'var(--bg-primary)' }}>
              {JSON.stringify(dailyTasksResult, null, 2)}
            </pre>
          )}
        </div>
        
        {/* Daily Batch Emails */}
        <div className="p-5 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-3xl mb-3">📧</div>
          <h2 className="text-lg font-semibold mb-2">Send Daily Attendance Emails</h2>
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            Manually trigger batch email notifications for today's attendance.
          </p>
          <button 
            onClick={sendBatchEmails} 
            disabled={sending}
            className="btn-primary w-full"
          >
            {sending ? 'Sending...' : 'Send Daily Emails'}
          </button>
          {result && (
            <pre className="mt-4 p-2 rounded text-xs overflow-auto max-h-60" style={{ background: 'var(--bg-primary)' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
        
        {/* Absent Reminders */}
        <div className="p-5 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-3xl mb-3">⚠️</div>
          <h2 className="text-lg font-semibold mb-2">Send Absent Reminders</h2>
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            Send reminder emails to parents of students marked absent today.
          </p>
          <button 
            onClick={sendAbsentReminders} 
            disabled={sendingReminders}
            className="btn-primary w-full"
          >
            {sendingReminders ? 'Sending...' : 'Send Absent Reminders'}
          </button>
          {reminderResult && (
            <pre className="mt-4 p-2 rounded text-xs overflow-auto max-h-60" style={{ background: 'var(--bg-primary)' }}>
              {JSON.stringify(reminderResult, null, 2)}
            </pre>
          )}
        </div>
        
        {/* Monthly Reports */}
        <div className="p-5 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-3xl mb-3">📊</div>
          <h2 className="text-lg font-semibold mb-2">Send Monthly Reports</h2>
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            Generate and send monthly attendance reports to all parents.
          </p>
          <button 
            onClick={async () => {
              const res = await fetch('/api/cron/monthly-report');
              const data = await res.json();
              alert(`Monthly Report:\nSent: ${data.sent} reports\nFailed: ${data.failed || 0}`);
            }} 
            className="btn-primary w-full"
          >
            Send Monthly Reports
          </button>
        </div>
      </div>
      
      {/* Info Section */}
      <div className="mt-6 p-4 rounded-lg border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <h3 className="font-semibold mb-2" style={{ color: 'var(--accent)' }}>⏰ Auto-Schedule Information</h3>
        <ul className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
          <li>⏰ <strong>Daily Tasks:</strong> Runs daily at 10:00 AM (Mark absent + Send emails + Reminders)</li>
          <li>📧 <strong>Daily Attendance Emails:</strong> Every 5 minutes (when admin panel open)</li>
          <li>⚠️ <strong>Absent Reminders:</strong> Part of daily tasks at 10:00 AM</li>
          <li>📊 <strong>Monthly Reports:</strong> 1st of each month at 8:00 AM</li>
          <li>📅 <strong>Holidays:</strong> No notifications sent on holidays</li>
        </ul>
      </div>
    </div>
  );
}