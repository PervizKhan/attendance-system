'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface Student {
  _id: string;
  name: string;
  studentId: string;
  parentPhone: string;
}

export default function QRPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const res = await fetch('/api/admin/students');
    const data = await res.json();
    setStudents(data.filter((s: any) => s.parentPhone));
    setLoading(false);
  };

  const generateOptInLink = (phone: string, name: string) => {
    let cleanNumber = phone.replace(/[^0-9]/g, '');
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '92' + cleanNumber.substring(1);
    }
    if (!cleanNumber.startsWith('92')) {
      cleanNumber = '92' + cleanNumber;
    }
    const message = `I would like to receive attendance notifications for my child ${name}.`;
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">WhatsApp QR Codes</h1>
      <p className="text-gray-600 mb-6">Print these QR codes and paste at school gate. Parents scan to receive attendance notifications.</p>
      
      {students.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No WhatsApp numbers added. Edit students to add WhatsApp numbers.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {students.map((student) => {
            const link = generateOptInLink(student.parentPhone, student.name);
            
            return (
              <div key={student._id} className="bg-white rounded-xl p-4 text-center shadow">
                <QRCodeSVG value={link} size={150} />
                <p className="font-semibold mt-3">{student.name}</p>
                <p className="text-xs text-gray-500">{student.studentId}</p>
                <p className="text-xs text-green-600 mt-1">{student.parentPhone}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}