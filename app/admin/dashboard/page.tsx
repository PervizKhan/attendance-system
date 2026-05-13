'use client';

import { useEffect, useState } from 'react';

interface ChartData {
  labels: string[];
  present: number[];
  absent: number[];
  total: number[];
}

export default function DashboardCharts() {
  const [chartData, setChartData] = useState<ChartData>({ labels: [], present: [], absent: [], total: [] });
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ present: 0, absent: 0, total: 0, attendanceRate: 0 });

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      const res = await fetch('/api/admin/chart-data');
      const data = await res.json();
      setChartData(data);
      
      const totalPresent = data.present.reduce((a: number, b: number) => a + b, 0);
      const totalAbsent = data.absent.reduce((a: number, b: number) => a + b, 0);
      const totalStudents = data.total.reduce((a: number, b: number) => a + b, 0);
      
      setSummary({
        present: totalPresent,
        absent: totalAbsent,
        total: totalStudents,
        attendanceRate: totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0,
      });
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxValue = Math.max(...chartData.present, ...chartData.absent, 20);

  if (loading) {
    return <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--accent)' }}>Attendance Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-2xl mb-1">📊</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{summary.attendanceRate}%</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Attendance Rate</div>
        </div>
        <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-2xl mb-1">✅</div>
          <div className="text-2xl font-bold text-green-500">{summary.present}</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Present</div>
        </div>
        <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-2xl mb-1">❌</div>
          <div className="text-2xl font-bold text-red-500">{summary.absent}</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Absent</div>
        </div>
        <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-2xl mb-1">👨‍🎓</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{summary.total}</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Students</div>
        </div>
      </div>
      
      {/* Bar Chart */}
      <div className="p-6 rounded-xl border mb-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <h2 className="text-lg font-semibold mb-4">Weekly Attendance Trend</h2>
        <div className="space-y-3">
          {chartData.labels.map((label, i) => {
            const presentHeight = (chartData.present[i] / maxValue) * 200;
            const absentHeight = (chartData.absent[i] / maxValue) * 200;
            
            return (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{label}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>Present: {chartData.present[i]} | Absent: {chartData.absent[i]}</span>
                </div>
                <div className="flex h-8 rounded-lg overflow-hidden">
                  <div 
                    className="bg-green-500 transition-all duration-500"
                    style={{ width: `${(chartData.present[i] / (chartData.total[i] || 1)) * 100}%` }}
                  />
                  <div 
                    className="bg-red-500 transition-all duration-500"
                    style={{ width: `${(chartData.absent[i] / (chartData.total[i] || 1)) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Progress Ring */}
      <div className="p-6 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <h2 className="text-lg font-semibold mb-4">Overall Attendance</h2>
        <div className="flex justify-center">
          <div className="relative w-48 h-48">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border)" strokeWidth="10" />
              <circle 
                cx="50" cy="50" r="45" fill="none" 
                stroke="var(--accent)" strokeWidth="10"
                strokeDasharray={`${summary.attendanceRate * 2.83} 283`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
              <text x="50" y="55" textAnchor="middle" fontSize="18" fontWeight="bold" fill="var(--accent)">
                {summary.attendanceRate}%
              </text>
            </svg>
          </div>
        </div>
        <p className="text-center text-sm mt-4" style={{ color: 'var(--text-secondary)' }}>
          {summary.attendanceRate >= 90 ? 'Excellent attendance! 🎉' : 
           summary.attendanceRate >= 75 ? 'Good attendance 👍' : 
           'Needs improvement ⚠️'}
        </p>
      </div>
    </div>
  );
}