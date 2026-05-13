'use client';

import { useEffect, useState, useRef } from 'react';
import Webcam from 'react-webcam';

interface Staff {
  _id: string;
  staffId: string;
  name: string;
  fatherName?: string;
  designation: string;
  department?: string;
  phone?: string;
  email: string;
  shift: string;
  hasFace: boolean;  // ✅ Add this field
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState({
    staffId: '',
    name: '',
    fatherName: '',
    designation: '',
    department: '',
    phone: '',
    email: '',
    shift: 'morning',
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
      } catch (error) {
        console.error('Error loading face-api:', error);
      }
    };
    loadFaceAPI();
  }, []);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/admin/staff');
      const data = await res.json();
      console.log('Staff data:', data); // Debug log
      setStaff(data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({
          staffId: '', name: '', fatherName: '', designation: '', department: '', phone: '', email: '', shift: 'morning',
        });
        fetchStaff();
      }
    } catch (error) {
      console.error('Error adding staff:', error);
    }
  };

  const startFaceCapture = (staff: Staff) => {
    setSelectedStaff(staff);
    setShowFaceCapture(true);
    setStatus('Please look at the camera...');
  };

  const captureFace = async () => {
    if (!webcamRef.current || !selectedStaff || !faceapi || !modelsLoaded) return;
    setCapturing(true);
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    
    try {
      const img = await faceapi.fetchImage(imageSrc);
      const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
      if (detection && detection.descriptor) {
        const faceDescriptor = Array.from(detection.descriptor);
        const res = await fetch('/api/admin/staff/face', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staffId: selectedStaff._id, faceDescriptor }),
        });
        if (res.ok) {
          setStatus('✓ Face registered successfully!');
          setTimeout(() => { setShowFaceCapture(false); setSelectedStaff(null); fetchStaff(); }, 1500);
        } else { setStatus('❌ Failed to save face. Try again.'); }
      } else { setStatus('❌ No face detected.'); }
    } catch (error) { setStatus('❌ Error capturing face.'); }
    finally { setCapturing(false); }
  };

  const deleteStaff = async (id: string) => {
    if (confirm('Delete this staff member?')) {
      await fetch(`/api/admin/staff?id=${id}`, { method: 'DELETE' });
      fetchStaff();
    }
  };

  const filteredStaff = staff.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.staffId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="text-center py-12">Loading staff...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>👨‍🏫 Staff Management</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ Add Staff</button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input type="text" placeholder="🔍 Search by name, ID, or designation..." className="input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {/* Staff Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="p-3">ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Designation</th>
                <th className="p-3">Department</th>
                <th className="p-3">Shift</th>
                <th className="p-3">Face Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map(s => (
                <tr key={s._id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <td className="p-3">{s.staffId}</td>
                  <td className="p-3">{s.name}</td>
                  <td className="p-3">{s.designation}</td>
                  <td className="p-3">{s.department || '-'}</td>
                  <td className="p-3">{s.shift === 'morning' ? '🌅 Morning' : '🌙 Evening'}</td>
                  <td className="p-3">
                    {s.hasFace ? (
                      <span className="inline-flex items-center gap-1 text-green-500 font-semibold">
                        <span className="text-lg">✓</span> Registered
                      </span>
                    ) : (
                      <button 
                        onClick={() => startFaceCapture(s)} 
                        className="text-yellow-500 hover:text-yellow-400 text-sm"
                      >
                        📷 Register Face
                      </button>
                    )}
                  </td>
                  <td className="p-3">
                    <button onClick={() => deleteStaff(s._id)} className="text-red-500 hover:text-red-400 text-sm">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-xl p-6 w-full max-w-md" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--accent)' }}>Add Staff Member</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" placeholder="Staff ID*" className="input" value={formData.staffId} onChange={(e) => setFormData({...formData, staffId: e.target.value})} required />
              <input type="text" placeholder="Full Name*" className="input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              <input type="text" placeholder="Father's Name" className="input" value={formData.fatherName} onChange={(e) => setFormData({...formData, fatherName: e.target.value})} />
              <input type="text" placeholder="Designation* (Teacher, Principal, Admin)" className="input" value={formData.designation} onChange={(e) => setFormData({...formData, designation: e.target.value})} required />
              <input type="text" placeholder="Department (Optional)" className="input" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} />
              <input type="tel" placeholder="Phone" className="input" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              <input type="email" placeholder="Email*" className="input" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
              <select className="input" value={formData.shift} onChange={(e) => setFormData({...formData, shift: e.target.value})}>
                <option value="morning">Morning Shift (8:00 AM)</option>
                <option value="evening">Evening Shift (1:00 PM)</option>
              </select>
              <div className="flex gap-3 pt-3">
                <button type="submit" className="btn-primary flex-1">Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Face Capture Modal */}
      {showFaceCapture && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-xl p-6 w-full max-w-md text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--accent)' }}>Register Face: {selectedStaff.name}</h2>
            {modelsLoaded ? (
              <>
                <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="w-full rounded-lg" />
                <p className="mt-3 text-sm">{status || 'Center face and click Capture'}</p>
                <div className="flex gap-3 mt-4">
                  <button onClick={captureFace} disabled={capturing} className="btn-primary flex-1">{capturing ? 'Capturing...' : 'Capture Face'}</button>
                  <button onClick={() => setShowFaceCapture(false)} className="btn-secondary flex-1">Cancel</button>
                </div>
              </>
            ) : (<p>Loading face models...</p>)}
          </div>
        </div>
      )}
    </div>
  );
}