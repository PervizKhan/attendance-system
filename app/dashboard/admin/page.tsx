'use client';

import { useEffect, useState } from 'react';

interface Student {
  _id: string;
  name: string;
  studentId: string;
  className: string;
  contactEmail: string;
  parentPhone?: string;
  hasFace: boolean;
}

export default function AdminPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/admin/students');
      const data = await res.json();
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading students...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Student Management</h2>
        <button 
          onClick={() => alert('Add student form would go here')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add Student
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Class</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Face</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student._id} className="border-t">
                <td className="p-3">{student.name}</td>
                <td className="p-3">{student.studentId}</td>
                <td className="p-3">{student.className}</td>
                <td className="p-3">{student.contactEmail || '—'}</td>
                <td className="p-3">
                  {student.hasFace ? '✓' : '✗'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}