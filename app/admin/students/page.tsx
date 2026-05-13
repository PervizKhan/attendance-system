'use client';

import { useEffect, useState, useRef } from 'react';
import Webcam from 'react-webcam';

interface Student {
  _id: string;
  studentId: string;
  rollNo?: string;
  name: string;
  fatherName: string;
  className: string;
  address?: string;
  contactEmail: string;
  contactPhone?: string;
  parentPhone?: string;
  hasFace: boolean;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    studentId: '',
    rollNo: '',
    name: '',
    fatherName: '',
    className: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
    parentPhone: '',
  });

  const webcamRef = useRef<Webcam>(null);
  const [faceapi, setFaceapi] = useState<any>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [status, setStatus] = useState('');

  // Load face-api.js
  useEffect(() => {
    const loadFaceAPI = async () => {
      try {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
        script.async = true;
        
        await new Promise((resolve) => {
          script.onload = resolve;
          document.body.appendChild(script);
        });

        const faceapiModule = (window as any).faceapi;
        setFaceapi(faceapiModule);
        
        const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
        await Promise.all([
          faceapiModule.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapiModule.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapiModule.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        
        setModelsLoaded(true);
      } catch (error) {
        console.error('Error loading face-api:', error);
      }
    };
    
    loadFaceAPI();
  }, []);

  // Load students
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({
          studentId: '',
          rollNo: '',
          name: '',
          fatherName: '',
          className: '',
          address: '',
          contactEmail: '',
          contactPhone: '',
          parentPhone: '',
        });
        fetchStudents();
      }
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  const startFaceCapture = (student: Student) => {
    setSelectedStudent(student);
    setShowFaceCapture(true);
    setStatus('Please look at the camera...');
  };

  const captureFace = async () => {
    if (!webcamRef.current || !selectedStudent || !faceapi || !modelsLoaded) return;
    
    setCapturing(true);
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    try {
      const img = await faceapi.fetchImage(imageSrc);
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection && detection.descriptor) {
        const faceDescriptor = Array.from(detection.descriptor);
        
        const res = await fetch('/api/admin/students/face', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: selectedStudent._id, faceDescriptor }),
        });

        if (res.ok) {
          setStatus('✓ Face registered successfully!');
          setTimeout(() => {
            setShowFaceCapture(false);
            setSelectedStudent(null);
            fetchStudents();
          }, 1500);
        } else {
          setStatus('❌ Failed to save face. Try again.');
        }
      } else {
        setStatus('❌ No face detected. Please look at the camera.');
      }
    } catch (error) {
      console.error('Face capture error:', error);
      setStatus('❌ Error capturing face. Try again.');
    } finally {
      setCapturing(false);
    }
  };

  const deleteStudent = async (id: string) => {
    if (confirm('Delete this student?')) {
      await fetch(`/api/admin/students?id=${id}`, { method: 'DELETE' });
      fetchStudents();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center" style={{ color: 'var(--text-secondary)' }}>Loading students...</div>
      </div>
    );
  }

  return (
    <div className="p-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>Student Management</h1>
        <button 
          onClick={() => setShowForm(true)} 
          className="px-4 py-2 rounded-lg font-semibold transition"
          style={{ background: 'var(--accent)', color: '#0a1628' }}
        >
          + Add Student
        </button>
      </div>

      {/* Student Table */}
      <div className="rounded-xl shadow overflow-hidden border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="p-3 text-sm font-semibold" style={{ color: 'var(--accent)' }}>ID</th>
                <th className="p-3 text-sm font-semibold" style={{ color: 'var(--accent)' }}>Name</th>
                <th className="p-3 text-sm font-semibold" style={{ color: 'var(--accent)' }}>Father's Name</th>
                <th className="p-3 text-sm font-semibold" style={{ color: 'var(--accent)' }}>Class</th>
                <th className="p-3 text-sm font-semibold" style={{ color: 'var(--accent)' }}>WhatsApp</th>
                <th className="p-3 text-sm font-semibold" style={{ color: 'var(--accent)' }}>Face</th>
                <th className="p-3 text-sm font-semibold" style={{ color: 'var(--accent)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student._id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <td className="p-3" style={{ color: 'var(--text-primary)' }}>{student.studentId}</td>
                  <td className="p-3 font-medium" style={{ color: 'var(--text-primary)' }}>{student.name}</td>
                  <td className="p-3" style={{ color: 'var(--text-secondary)' }}>{student.fatherName}</td>
                  <td className="p-3" style={{ color: 'var(--text-primary)' }}>{student.className}</td>
                  <td className="p-3" style={{ color: 'var(--text-secondary)' }}>{student.parentPhone || 'Not added'}</td>
                  <td className="p-3">
                    {student.hasFace ? (
                      <span className="text-green-500">✓ Registered</span>
                    ) : (
                      <button
                        onClick={() => startFaceCapture(student)}
                        className="text-sm hover:underline"
                        style={{ color: 'var(--accent)' }}
                      >
                        Register Face
                      </button>
                    )}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => deleteStudent(student._id)}
                      className="text-sm hover:underline"
                      style={{ color: '#ef4444' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {students.length === 0 && (
          <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
            No students found. Click "Add Student" to get started.
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--accent)' }}>Add Student</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Student ID*"
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Roll No (Optional)"
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                value={formData.rollNo}
                onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
              />
              <input
                type="text"
                placeholder="Full Name*"
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Father's Name*"
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                value={formData.fatherName}
                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Class*"
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                value={formData.className}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                required
              />
              <textarea
                placeholder="Address"
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition"
                rows={2}
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
              <input
                type="email"
                placeholder="Parent Email*"
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                required
              />
              <input
                type="tel"
                placeholder="Parent WhatsApp Number (e.g., 03001234567)"
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                value={formData.parentPhone}
                onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
              />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>WhatsApp number for attendance notifications</p>
              <div className="flex gap-3 pt-3">
                <button type="submit" className="flex-1 py-2 rounded-lg font-semibold transition" style={{ background: 'var(--accent)', color: '#0a1628' }}>
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 rounded-lg font-semibold transition border"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Face Capture Modal */}
      {showFaceCapture && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-xl p-6 w-full max-w-md text-center border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--accent)' }}>Register Face: {selectedStudent.name}</h2>
            {modelsLoaded ? (
              <>
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-full rounded-lg"
                  videoConstraints={{
                    width: { ideal: 480 },
                    height: { ideal: 640 },
                    facingMode: "user",
                  }}
                />
                <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{status || 'Center face in camera and click Capture'}</p>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={captureFace}
                    disabled={capturing}
                    className="flex-1 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                    style={{ background: 'var(--accent)', color: '#0a1628' }}
                  >
                    {capturing ? 'Capturing...' : 'Capture Face'}
                  </button>
                  <button
                    onClick={() => setShowFaceCapture(false)}
                    className="flex-1 py-2 rounded-lg font-semibold transition border"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>Loading face recognition models...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}