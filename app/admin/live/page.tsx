'use client';

import { useEffect, useState } from 'react';

interface AttendanceEvent {
  studentName: string;
  className: string;
  time: string;
  status: string;
}

export default function LiveMonitor() {
  const [events, setEvents] = useState<AttendanceEvent[]>([]);
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    // Poll for new attendance every 5 seconds
    const interval = setInterval(async () => {
      const res = await fetch('/api/admin/today-attendance');
      const data = await res.json();
      setEvents(data.recent);
      setTodayCount(data.total);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Live Gate Monitor</h1>
      <div className="bg-green-100 rounded-lg p-3 mb-4 text-center">
        <div className="text-3xl font-bold text-green-700">{todayCount}</div>
        <div className="text-sm">Students marked today</div>
      </div>
      <div className="space-y-2">
        {events.map((event, i) => (
          <div key={i} className="bg-white rounded-lg p-3 shadow flex justify-between items-center">
            <div>
              <div className="font-semibold">{event.studentName}</div>
              <div className="text-xs text-gray-500">{event.className}</div>
            </div>
            <div className="text-right">
              <div className="text-green-600 text-sm">✓ Present</div>
              <div className="text-xs text-gray-400">{event.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}