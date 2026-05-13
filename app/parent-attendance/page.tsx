'use client';

import { useState } from 'react';

interface AttendanceRecord {
  date: string;
  status: string;
  time: string;
  className: string;
}

export default function ParentAttendancePage() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState<any>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const searchStudent = async () => {
    if (!phone) {
      setError('Please enter WhatsApp number');
      return;
    }
    
    setLoading(true);
    setError('');
    setCurrentPage(1);
    
    try {
      const res = await fetch(`/api/parent/student?phone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      
      if (res.ok) {
        setStudent(data.student);
        setAttendance(data.attendance || []);
      } else {
        setError(data.error || 'Student not found');
        setStudent(null);
        setAttendance([]);
      }
    } catch (err) {
      setError('Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(attendance.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAttendance = attendance.slice(startIndex, endIndex);

  // Calculate statistics
  const totalPresent = attendance.filter(a => a.status === 'present').length;
  const totalAbsent = attendance.filter(a => a.status === 'absent').length;
  const attendanceRate = attendance.length > 0 ? Math.round((totalPresent / attendance.length) * 100) : 0;

  // Export to Excel (CSV)
  const exportToCSV = () => {
    const headers = ['Date', 'Status', 'Time', 'Class'];
    const rows = attendance.map(a => [
      new Date(a.date).toLocaleDateString(),
      a.status === 'present' ? 'Present' : 'Absent',
      a.time ? new Date(a.time).toLocaleTimeString() : '-',
      a.className,
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${student?.name || 'attendance'}_attendance.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print as PDF (using browser print)
  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const recordsHtml = attendance.map(a => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(a.date).toLocaleDateString()}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">
          <span style="color: ${a.status === 'present' ? 'green' : 'red'}">
            ${a.status === 'present' ? '✓ Present' : '✗ Absent'}
          </span>
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${a.time ? new Date(a.time).toLocaleTimeString() : '-'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${a.className}</td>
      </tr>
    `).join('');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${student?.name} - Attendance Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #d4af37; }
          .header { margin-bottom: 30px; }
          .info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #0b1f3a; color: white; padding: 10px; text-align: left; }
          .summary { margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px; }
          @media print {
            body { margin: 0; padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Attendance Report</h1>
        </div>
        <div class="info">
          <p><strong>Student Name:</strong> ${student?.name}</p>
          <p><strong>Student ID:</strong> ${student?.studentId}</p>
          <p><strong>Class:</strong> ${student?.className || 'Not assigned'}</p>
          <p><strong>Father's Name:</strong> ${student?.fatherName}</p>
        </div>
        <div class="summary">
          <strong>Summary:</strong><br/>
          Total Present: ${totalPresent} | Total Absent: ${totalAbsent} | Attendance Rate: ${attendanceRate}%
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>Time</th>
              <th>Class</th>
            </tr>
          </thead>
          <tbody>
            ${recordsHtml}
          </tbody>
        </table>
        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #d4af37; border: none; border-radius: 5px; cursor: pointer;">Print / Save as PDF</button>
        </div>
        <script>
          setTimeout(() => { window.print(); }, 500);
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">👨‍👩‍👧</div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>Parent Portal</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Check your child's attendance</p>
        </div>
        
        {/* Search Form */}
        <div className="p-6 rounded-xl border mb-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <label className="label">WhatsApp Number</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="tel"
              placeholder="Enter WhatsApp number (e.g., 03001234567)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input flex-1"
              onKeyPress={(e) => e.key === 'Enter' && searchStudent()}
            />
            <button onClick={searchStudent} disabled={loading} className="btn-primary sm:w-auto">
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          {error && <div className="mt-3 text-sm text-red-500">{error}</div>}
        </div>
        
        {student && (
          <>
            {/* Student Info Card */}
            <div className="p-6 rounded-xl border mb-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">👨‍🎓</div>
                  <div>
                    <h2 className="text-xl font-bold">{student.name}</h2>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      <p style={{ color: 'var(--text-secondary)' }}><strong>ID:</strong> {student.studentId}</p>
                      <p style={{ color: 'var(--text-secondary)' }}><strong>Class:</strong> {student.className || 'Not assigned'}</p>
                      <p style={{ color: 'var(--text-secondary)' }}><strong>Father:</strong> {student.fatherName}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={exportToCSV} className="btn-secondary text-sm px-3 py-2">
                    📥 Excel
                  </button>
                  <button onClick={exportToPDF} className="btn-secondary text-sm px-3 py-2">
                    📄 PDF
                  </button>
                </div>
              </div>
            </div>
            
            {/* Statistics Summary */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-3 text-center rounded-lg border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div className="text-xl mb-1">📋</div>
                <div className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{attendance.length}</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total Days</div>
              </div>
              <div className="p-3 text-center rounded-lg border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div className="text-xl mb-1">✅</div>
                <div className="text-lg font-bold text-green-500">{totalPresent}</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Present</div>
              </div>
              <div className="p-3 text-center rounded-lg border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div className="text-xl mb-1">📊</div>
                <div className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{attendanceRate}%</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Attendance</div>
              </div>
            </div>
            
            {/* Attendance Table */}
            <div className="p-6 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <h3 className="text-lg font-semibold mb-4">Attendance Records</h3>
              
              {attendance.length === 0 ? (
                <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                  No attendance records found
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                          <th className="p-2 text-left">Date</th>
                          <th className="p-2 text-left">Status</th>
                          <th className="p-2 text-left">Time</th>
                          <th className="p-2 text-left">Class</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentAttendance.map((record, i) => (
                          <tr key={i} className="border-b" style={{ borderColor: 'var(--border)' }}>
                            <td className="p-2" style={{ color: 'var(--text-primary)' }}>
                              {new Date(record.date).toLocaleDateString()}
                            </td>
                            <td className="p-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                record.status === 'present' 
                                  ? 'bg-green-500/20 text-green-500' 
                                  : 'bg-red-500/20 text-red-500'
                              }`}>
                                {record.status === 'present' ? '✓ Present' : '✗ Absent'}
                              </span>
                            </td>
                            <td className="p-2" style={{ color: 'var(--text-secondary)' }}>
                              {record.time ? new Date(record.time).toLocaleTimeString() : '-'}
                            </td>
                            <td className="p-2" style={{ color: 'var(--text-secondary)' }}>
                              {record.className || student.className || 'Not assigned'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded text-sm disabled:opacity-50"
                        style={{ background: 'var(--bg-primary)' }}
                      >
                        First
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded text-sm disabled:opacity-50"
                        style={{ background: 'var(--bg-primary)' }}
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded text-sm disabled:opacity-50"
                        style={{ background: 'var(--bg-primary)' }}
                      >
                        Next
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded text-sm disabled:opacity-50"
                        style={{ background: 'var(--bg-primary)' }}
                      >
                        Last
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
        
        {/* Instructions */}
        <div className="mt-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          <p>Enter your registered WhatsApp number to view your child's attendance</p>
          <p className="mt-1">Contact school office if number needs to be updated</p>
        </div>
      </div>
    </div>
  );
}