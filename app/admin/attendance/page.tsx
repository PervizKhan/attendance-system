'use client';

import { useEffect, useState } from 'react';

interface AttendanceRecord {
  id: string;
  studentName: string;
  studentId: string;
  className: string;
  time: string;
  date: string;
  confidence: number;
  status: string;
}

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today');
  const [markingAbsent, setMarkingAbsent] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    uniqueStudents: 0,
    classes: {} as Record<string, number>,
  });

  useEffect(() => {
    fetchAttendance();
  }, [filter]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/attendance?filter=${filter}`);
      const data = await res.json();
      setAttendance(data.records || []);
      
      // Calculate stats
      const uniqueStudents = new Set(data.records?.map((r: AttendanceRecord) => r.studentId)).size;
      const classes: Record<string, number> = {};
      data.records?.forEach((r: AttendanceRecord) => {
        classes[r.className] = (classes[r.className] || 0) + 1;
      });
      
      setStats({
        total: data.records?.length || 0,
        uniqueStudents,
        classes,
      });
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAbsent = async () => {
    setMarkingAbsent(true);
    try {
      const res = await fetch('/api/admin/mark-absent', { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        alert(`✅ ${data.message}\n\nTotal Students: ${data.total}\nPresent: ${data.present}\nMarked Absent: ${data.absent}`);
        // Refresh attendance to show updated data
        fetchAttendance();
      } else {
        alert('Failed to mark absent students');
      }
    } catch (error) {
      console.error('Error marking absent:', error);
      alert('Error marking absent students');
    } finally {
      setMarkingAbsent(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Student Name', 'Student ID', 'Class', 'Date', 'Time', 'Confidence'];
    const rows = attendance.map(a => [
      a.studentName,
      a.studentId,
      a.className,
      new Date(a.date).toLocaleDateString(),
      new Date(a.time).toLocaleTimeString(),
      `${Math.round(a.confidence * 100)}%`,
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Header with Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>Attendance Reports</h1>
        <div className="flex gap-3">
          <button
            onClick={markAbsent}
            disabled={markingAbsent}
            className="px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50"
            style={{ background: 'var(--warning)', color: '#0a1628' }}
          >
            {markingAbsent ? '⏳ Marking...' : '⏰ Mark Absent (After 9 AM)'}
          </button>
          <button
            onClick={exportToCSV}
            disabled={attendance.length === 0}
            className="px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#0a1628' }}
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-2xl mb-1">📋</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{stats.total}</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Check-ins</div>
        </div>
        <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-2xl mb-1">👨‍🎓</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{stats.uniqueStudents}</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Unique Students</div>
        </div>
        <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-2xl mb-1">📚</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{Object.keys(stats.classes).length}</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Classes</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['today', 'yesterday', 'week', 'month'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg capitalize transition ${
              filter === f
                ? 'font-semibold'
                : 'opacity-60'
            }`}
            style={{
              background: filter === f ? 'var(--accent)' : 'var(--bg-card)',
              color: filter === f ? '#0a1628' : 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
          >
            {f === 'today' ? 'Today' : f === 'yesterday' ? 'Yesterday' : f === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>

      {/* Info Note about Absent Marking */}
      <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: 'var(--warning)' }}>
        💡 <strong>Note:</strong> Click "Mark Absent" after 9:00 AM to automatically mark absent students who haven't checked in.
      </div>

      {/* Attendance Table */}
      {loading ? (
        <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
          Loading attendance records...
        </div>
      ) : attendance.length === 0 ? (
        <div className="text-center py-12 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-4xl mb-2">📭</div>
          <div style={{ color: 'var(--text-secondary)' }}>No attendance records found</div>
          <div className="text-sm mt-1 opacity-60">Students will appear here after marking attendance at the gate</div>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="p-3 text-sm font-semibold" style={{ color: 'var(--accent)' }}>Student Name</th>
                  <th className="p-3 text-sm font-semibold" style={{ color: 'var(--accent)' }}>ID</th>
                  <th className="p-3 text-sm font-semibold" style={{ color: 'var(--accent)' }}>Class</th>
                  <th className="p-3 text-sm font-semibold" style={{ color: 'var(--accent)' }}>Date</th>
                  <th className="p-3 text-sm font-semibold" style={{ color: 'var(--accent)' }}>Time</th>
                  <th className="p-3 text-sm font-semibold" style={{ color: 'var(--accent)' }}>Status</th>
                  <th className="p-3 text-sm font-semibold" style={{ color: 'var(--accent)' }}>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record) => (
                  <tr key={record.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                    <td className="p-3" style={{ color: 'var(--text-primary)' }}>{record.studentName}</td>
                    <td className="p-3" style={{ color: 'var(--text-secondary)' }}>{record.studentId}</td>
                    <td className="p-3" style={{ color: 'var(--text-primary)' }}>{record.className}</td>
                    <td className="p-3" style={{ color: 'var(--text-secondary)' }}>{new Date(record.date).toLocaleDateString()}</td>
                    <td className="p-3" style={{ color: 'var(--text-secondary)' }}>{record.time ? new Date(record.time).toLocaleTimeString() : '—'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        record.status === 'present' ? 'text-green-500' : 
                        record.status === 'absent' ? 'text-red-500' : 'text-yellow-500'
                      }`}>
                        {record.status === 'present' ? '✓ Present' : 
                         record.status === 'absent' ? '✗ Absent' : '⚠️ Late'}
                      </span>
                    </td>
                    <td className="p-3">
                      {record.confidence ? (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          record.confidence > 0.8 ? 'text-green-500' : 
                          record.confidence > 0.6 ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                          {Math.round(record.confidence * 100)}%
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}