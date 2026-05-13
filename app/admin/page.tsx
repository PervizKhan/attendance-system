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

export default function AdminPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
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
  const [editFormData, setEditFormData] = useState({
    name: '',
    fatherName: '',
    className: '',
    studentId: '',
    contactEmail: '',
    parentPhone: '',
    address: '',
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
        await new Promise((resolve) => { script.onload = resolve; document.body.appendChild(script); });
        const faceapiModule = (window as any).faceapi;
        setFaceapi(faceapiModule);
        const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
        await Promise.all([
          faceapiModule.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapiModule.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapiModule.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (error) { console.error('Error loading face-api:', error); }
    };
    loadFaceAPI();
  }, []);

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/admin/students');
      const data = await res.json();
      setStudents(data);
    } catch (error) { console.error('Error fetching students:', error); }
    finally { setLoading(false); }
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
          studentId: '', rollNo: '', name: '', fatherName: '', className: '',
          address: '', contactEmail: '', contactPhone: '', parentPhone: '',
        });
        fetchStudents();
      }
    } catch (error) { console.error('Error adding student:', error); }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingStudent?._id, ...editFormData }),
      });
      if (res.ok) {
        setShowEditModal(false);
        setEditingStudent(null);
        fetchStudents();
      }
    } catch (error) { console.error('Error updating student:', error); }
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
      const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
      if (detection && detection.descriptor) {
        const faceDescriptor = Array.from(detection.descriptor);
        const res = await fetch('/api/admin/students/face', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: selectedStudent._id, faceDescriptor }),
        });
        if (res.ok) {
          setStatus('✓ Face registered successfully!');
          setTimeout(() => { setShowFaceCapture(false); setSelectedStudent(null); fetchStudents(); }, 1500);
        } else { setStatus('❌ Failed to save face. Try again.'); }
      } else { setStatus('❌ No face detected. Please look at the camera.'); }
    } catch (error) { setStatus('❌ Error capturing face. Try again.'); }
    finally { setCapturing(false); }
  };

  const deleteStudent = async (id: string) => {
    if (confirm('Delete this student?')) {
      await fetch(`/api/admin/students?id=${id}`, { method: 'DELETE' });
      fetchStudents();
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === '' || student.className === filterClass;
    return matchesSearch && matchesClass;
  });

  const uniqueClasses = [...new Set(students.map(s => s.className))];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div style={{ color: 'var(--text-secondary)' }}>Loading students...</div>
    </div>;
  }

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', padding: '16px' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--accent)' }}>Student Management</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm md:text-base px-3 py-1 md:px-4 md:py-2">+ Add</button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex-1 min-w-[150px]">
          <input type="text" placeholder="🔍 Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input text-sm" />
        </div>
        <div className="w-32">
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="input text-sm">
            <option value="">All Classes</option>
            {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {(searchTerm || filterClass) && (
          <button onClick={() => { setSearchTerm(''); setFilterClass(''); }} className="btn-secondary text-sm px-3 py-1">
            Clear
          </button>
        )}
      </div>

      {/* Mobile: Card View */}
      <div className="block md:hidden space-y-3">
        {filteredStudents.map((student) => (
          <div key={student._id} className="p-4 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-bold text-base">{student.name}</h3>
                <p className="text-xs opacity-70 mt-0.5">ID: {student.studentId} • Class: {student.className}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingStudent(student); setEditFormData({ name: student.name, fatherName: student.fatherName, className: student.className, studentId: student.studentId, contactEmail: student.contactEmail || '', parentPhone: student.parentPhone || '', address: student.address || '' }); setShowEditModal(true); }}
                  className="text-blue-500 text-lg px-1"
                  title="Edit"
                >
                  ✏️
                </button>
                <button onClick={() => deleteStudent(student._id)} className="text-red-500 text-lg px-1" title="Delete">
                  🗑️
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div>
                <span className="text-xs opacity-70 block">Father's Name</span>
                <span className="text-sm">{student.fatherName}</span>
              </div>
              <div>
                <span className="text-xs opacity-70 block">WhatsApp</span>
                <span className="text-sm">{student.parentPhone || '—'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-xs opacity-70 block">Email</span>
                <span className="text-xs break-all">{student.contactEmail}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <div>
                {student.hasFace ? (
                  <span className="text-green-500 text-sm flex items-center gap-1">✓ Face Registered</span>
                ) : (
                  <button onClick={() => startFaceCapture(student)} className="text-accent text-sm flex items-center gap-1">
                    📷 Register Face
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table View */}
      <div className="hidden md:block rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="p-2 text-sm">ID</th>
                <th className="p-2 text-sm">Name</th>
                <th className="p-2 text-sm">Father Name</th>
                <th className="p-2 text-sm">Class</th>
                <th className="p-2 text-sm">WhatsApp</th>
                <th className="p-2 text-sm">Face</th>
                <th className="p-2 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student._id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <td className="p-2 text-sm">{student.studentId}</td>
                  <td className="p-2 text-sm">{student.name}</td>
                  <td className="p-2 text-sm">{student.fatherName}</td>
                  <td className="p-2 text-sm">{student.className}</td>
                  <td className="p-2 text-sm">{student.parentPhone || '-'}</td>
                  <td className="p-2 text-sm">
                    {student.hasFace ? <span className="text-green-500">✓</span> : <button onClick={() => startFaceCapture(student)} className="text-accent text-sm">Register</button>}
                  </td>
                  <td className="p-2 text-sm">
                    <button onClick={() => { setEditingStudent(student); setEditFormData({ name: student.name, fatherName: student.fatherName, className: student.className, studentId: student.studentId, contactEmail: student.contactEmail || '', parentPhone: student.parentPhone || '', address: student.address || '' }); setShowEditModal(true); }} className="text-blue-500 mr-2">Edit</button>
                    <button onClick={() => deleteStudent(student._id)} className="text-red-500">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* No Results */}
      {filteredStudents.length === 0 && (
        <div className="text-center py-8 opacity-70">No students found</div>
      )}

      {/* Add Student Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--accent)' }}>Add Student</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" placeholder="Student ID*" className="input text-sm" value={formData.studentId} onChange={(e) => setFormData({ ...formData, studentId: e.target.value })} required />
              <input type="text" placeholder="Full Name*" className="input text-sm" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <input type="text" placeholder="Father's Name*" className="input text-sm" value={formData.fatherName} onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })} required />
              <input type="text" placeholder="Class*" className="input text-sm" value={formData.className} onChange={(e) => setFormData({ ...formData, className: e.target.value })} required />
              <input type="email" placeholder="Parent Email*" className="input text-sm" value={formData.contactEmail} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} required />
              <input type="tel" placeholder="Parent WhatsApp" className="input text-sm" value={formData.parentPhone} onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })} />
              <div className="flex gap-3 pt-3">
                <button type="submit" className="btn-primary flex-1 text-sm py-2">Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 text-sm py-2">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--accent)' }}>Edit Student</h2>
            <form onSubmit={handleUpdateStudent} className="space-y-3">
              <input type="text" placeholder="Student ID*" className="input text-sm" value={editFormData.studentId} onChange={(e) => setEditFormData({ ...editFormData, studentId: e.target.value })} required />
              <input type="text" placeholder="Full Name*" className="input text-sm" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} required />
              <input type="text" placeholder="Father's Name*" className="input text-sm" value={editFormData.fatherName} onChange={(e) => setEditFormData({ ...editFormData, fatherName: e.target.value })} required />
              <input type="text" placeholder="Class*" className="input text-sm" value={editFormData.className} onChange={(e) => setEditFormData({ ...editFormData, className: e.target.value })} required />
              <input type="email" placeholder="Parent Email*" className="input text-sm" value={editFormData.contactEmail} onChange={(e) => setEditFormData({ ...editFormData, contactEmail: e.target.value })} required />
              <input type="tel" placeholder="Parent WhatsApp" className="input text-sm" value={editFormData.parentPhone} onChange={(e) => setEditFormData({ ...editFormData, parentPhone: e.target.value })} />
              <textarea placeholder="Address" className="input text-sm" rows={2} value={editFormData.address} onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })} />
              <div className="flex gap-3 pt-3">
                <button type="submit" className="btn-primary flex-1 text-sm py-2">Update</button>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary flex-1 text-sm py-2">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Face Capture Modal */}
      {showFaceCapture && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-5 w-full max-w-md text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--accent)' }}>Register Face: {selectedStudent.name}</h2>
            {modelsLoaded ? (
              <>
                <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="w-full rounded-lg" />
                <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{status || 'Center face and click Capture'}</p>
                <div className="flex gap-3 mt-4">
                  <button onClick={captureFace} disabled={capturing} className="btn-primary flex-1 text-sm py-2">{capturing ? 'Capturing...' : 'Capture Face'}</button>
                  <button onClick={() => setShowFaceCapture(false)} className="btn-secondary flex-1 text-sm py-2">Cancel</button>
                </div>
              </>
            ) : (<p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading face models...</p>)}
          </div>
        </div>
      )}
    </div>
  );
}