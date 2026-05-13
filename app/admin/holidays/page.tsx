'use client';

import { useEffect, useState } from 'react';

interface Holiday {
  _id: string;
  name: string;
  date: string;
  type: string;
  description: string;
}

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    type: 'public',
    description: '',
  });

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      const res = await fetch('/api/admin/holidays');
      const data = await res.json();
      setHolidays(data);
    } catch (error) {
      console.error('Error fetching holidays:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({ name: '', date: '', type: 'public', description: '' });
        fetchHolidays();
      }
    } catch (error) {
      console.error('Error adding holiday:', error);
    }
  };

  const deleteHoliday = async (id: string) => {
    if (confirm('Delete this holiday?')) {
      await fetch(`/api/admin/holidays?id=${id}`, { method: 'DELETE' });
      fetchHolidays();
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'public': return 'text-green-500';
      case 'school': return 'text-blue-500';
      case 'exam': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>School Holidays</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ Add Holiday</button>
      </div>

      {/* Add Holiday Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-xl p-6 w-full max-w-md" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--accent)' }}>Add Holiday</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" placeholder="Holiday Name*" className="input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              <input type="date" className="input" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
              <select className="input" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                <option value="public">Public Holiday</option>
                <option value="school">School Holiday</option>
                <option value="exam">Exam Day</option>
                <option value="emergency">Emergency Closure</option>
              </select>
              <textarea placeholder="Description (Optional)" className="input" rows={2} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              <div className="flex gap-3 pt-3">
                <button type="submit" className="btn-primary flex-1">Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Holidays List */}
      {loading ? (
        <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>Loading holidays...</div>
      ) : holidays.length === 0 ? (
        <div className="text-center py-12 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-4xl mb-2">📅</div>
          <div style={{ color: 'var(--text-secondary)' }}>No holidays added yet</div>
          <div className="text-sm mt-1">Add holidays to skip attendance marking on those days</div>
        </div>
      ) : (
        <div className="space-y-2">
          {holidays.map((holiday) => (
            <div key={holiday._id} className="p-4 rounded-lg border flex justify-between items-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div>
                <div className="font-semibold">{holiday.name}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {new Date(holiday.date).toLocaleDateString()} • <span className={getTypeColor(holiday.type)}>{holiday.type}</span>
                </div>
                {holiday.description && <div className="text-xs mt-1 opacity-70">{holiday.description}</div>}
              </div>
              <button onClick={() => deleteHoliday(holiday._id)} className="text-red-500 hover:text-red-700">Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}