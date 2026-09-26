// app/admin/face-training/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import Webcam from 'react-webcam';

interface Student {
  _id: string;
  name: string;
  studentId: string;
  className: string;
  hasFace: boolean;
}

export default function FaceTrainingPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    studentsWithFace: 0,
    totalStudents: 0,
    studentCompletion: 0,
  });

  const [showTrainModal, setShowTrainModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const [faceapi, setFaceapi] = useState<any>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchData();
    loadFaceAPI();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, statsRes] = await Promise.all([
        fetch('/api/admin/students'),
        fetch('/api/admin/face-train'),
      ]);

      const studentsData = studentsRes.ok ? await studentsRes.json() : [];
      const statsData = statsRes.ok
        ? await statsRes.json()
        : { studentsWithFace: 0, totalStudents: 0, studentCompletion: 0 };

      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFaceAPI = async () => {
    try {
      const script = document.createElement('script');
      script.src =
        'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
      script.async = true;
      await new Promise((resolve) => {
        script.onload = resolve;
        document.body.appendChild(script);
      });

      const faceapiModule = (window as any).faceapi;
      setFaceapi(faceapiModule);

      const MODEL_URL =
        'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
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

  const startRetrain = (student: Student) => {
    setSelectedStudent(student);
    setShowTrainModal(true);
    setStatus('Please look at the camera...');
  };

  const captureAndRetrain = async () => {
    if (!webcamRef.current || !selectedStudent || !faceapi || !modelsLoaded) return;

    setCapturing(true);
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setCapturing(false);
      return;
    }

    try {
      const img = await faceapi.fetchImage(imageSrc);
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection && detection.descriptor) {
        const faceDescriptor = Array.from(detection.descriptor);

        const res = await fetch('/api/admin/face-train', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedStudent._id,
            faceDescriptor,
          }),
        });

        if (res.ok) {
          setStatus('✓ Face retrained successfully!');
          setTimeout(() => {
            setShowTrainModal(false);
            setSelectedStudent(null);
            fetchData();
          }, 1500);
        } else {
          setStatus('❌ Failed to retrain. Try again.');
        }
      } else {
        setStatus('❌ No face detected. Please look at the camera.');
      }
    } catch (error) {
      console.error('Retrain error:', error);
      setStatus('❌ Error capturing face. Try again.');
    } finally {
      setCapturing(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--accent)' }}>
        🎯 Face Recognition Training
      </h1>

      {/* Statistics Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div
          className="p-5 rounded-xl border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <h2 className="text-lg font-semibold">👨‍🎓 Students</h2>
              <p className="text-sm opacity-70">
                {stats.studentsWithFace} / {stats.totalStudents} faces registered
              </p>
            </div>
            <span className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
              {stats.studentCompletion}%
            </span>
          </div>
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ background: 'var(--border)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${stats.studentCompletion}%`, background: 'var(--accent)' }}
            />
          </div>
        </div>
      </div>

      {/* Students List */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="p-3">ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Class</th>
                <th className="p-3">Face Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student._id}
                  className="border-b"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <td className="p-3">{student.studentId}</td>
                  <td className="p-3">{student.name}</td>
                  <td className="p-3">{student.className}</td>
                  <td className="p-3">
                    {student.hasFace ? (
                      <span className="text-green-500">✓ Registered</span>
                    ) : (
                      <span className="text-red-500">✗ Not Registered</span>
                    )}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => startRetrain(student)}
                      disabled={!student.hasFace}
                      className={`px-3 py-1 rounded text-sm ${
                        student.hasFace ? 'btn-secondary' : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {student.hasFace ? '🔄 Retrain' : 'Register First'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Retrain Modal */}
      {showTrainModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-xl p-6 w-full max-w-md text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
              🔄 Retrain Face: {selectedStudent.name}
            </h2>
            <p className="text-sm mb-4 opacity-70">
              Look directly at the camera with good lighting
            </p>

            {modelsLoaded ? (
              <>
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-full rounded-lg"
                  videoConstraints={{
                    width: { ideal: 480 },
                    height: { ideal: 640 },
                    facingMode: 'user',
                  }}
                />
                <p className="mt-3 text-sm">{status || 'Center face and click Retrain'}</p>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={captureAndRetrain}
                    disabled={capturing}
                    className="btn-primary flex-1"
                  >
                    {capturing ? 'Processing...' : '🔄 Retrain Face'}
                  </button>
                  <button
                    onClick={() => setShowTrainModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <p className="py-8">Loading face recognition models...</p>
            )}
          </div>
        </div>
      )}

      {/* Tips */}
      <div
        className="mt-6 p-4 rounded-lg border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <h3 className="font-semibold mb-2" style={{ color: 'var(--accent)' }}>
          💡 Training Tips
        </h3>
        <ul className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
          <li>• Ensure good lighting on the face</li>
          <li>• Remove glasses or masks for better recognition</li>
          <li>• Look directly at the camera</li>
          <li>• Retrain if recognition is failing frequently</li>
          <li>• Best results with multiple training sessions</li>
        </ul>
      </div>
    </div>
  );
}