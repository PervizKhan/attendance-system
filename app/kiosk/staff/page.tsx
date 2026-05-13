'use client';

import { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';

export default function StaffKiosk() {
  const webcamRef = useRef<Webcam>(null);
  const [faceapi, setFaceapi] = useState<any>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [status, setStatus] = useState('Loading...');
  const [recognizing, setRecognizing] = useState(false);
  const [lastMarked, setLastMarked] = useState<any>(null);
  const [todayCount, setTodayCount] = useState(0);

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
        setStatus('Ready. Please look at camera.');
      } catch (error) { console.error('Error loading face-api:', error); }
    };
    loadFaceAPI();
  }, []);

  // Fetch all staff with registered faces
  useEffect(() => {
    if (!modelsLoaded) return;
    const fetchStaff = async () => {
      const res = await fetch('/api/kiosk/all-staff');
      const data = await res.json();
      setStaff(data);
      console.log(`Loaded ${data.length} staff members`);
    };
    fetchStaff();
  }, [modelsLoaded]);

  // Recognition loop
  useEffect(() => {
    if (!modelsLoaded || staff.length === 0 || recognizing) return;
    const interval = setInterval(recognizeFace, 3000);
    return () => clearInterval(interval);
  }, [modelsLoaded, staff, recognizing]);

  const recognizeFace = async () => {
    if (!webcamRef.current || recognizing || !faceapi || staff.length === 0) return;
    setRecognizing(true);
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    
    try {
      const img = await faceapi.fetchImage(imageSrc);
      const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
      
      if (detection && detection.descriptor) {
        const labeledDescriptors = staff.map(s => new faceapi.LabeledFaceDescriptors(s._id, [new Float32Array(s.faceDescriptor)]));
        const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors);
        const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
        
        if (bestMatch.distance < 0.6) {
          const matchedStaff = staff.find(s => s._id === bestMatch.label);
          if (matchedStaff) {
            setStatus(`✓ Recognized: ${matchedStaff.name}`);
            const res = await fetch('/api/kiosk/staff-mark', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ staffId: matchedStaff._id, confidence: 1 - bestMatch.distance, location: 'staff_gate' }),
            });
            const data = await res.json();
            if (data.success) {
              setLastMarked({ name: matchedStaff.name, status: data.status });
              setTodayCount(prev => prev + 1);
              setStatus(`✅ Attendance marked for ${matchedStaff.name}`);
              setTimeout(() => setStatus('Ready. Next staff please.'), 3000);
            } else { setStatus(`❌ ${data.message}`); }
          }
        } else { setStatus('Face not recognized. Please register first.'); }
      } else { setStatus('Looking for face...'); }
    } catch (error) { console.error('Recognition error:', error); }
    finally { setRecognizing(false); }
  };

  if (!modelsLoaded) return <div className="min-h-screen flex items-center justify-center">Loading face recognition models...</div>;

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="flex flex-col items-center">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">👨‍🏫 Staff Attendance</h1>
          <p className="text-gray-400">Please look at the camera to mark attendance</p>
        </div>
        <div className="relative w-full max-w-md rounded-xl overflow-hidden border-4 border-yellow-500">
          <Webcam ref={webcamRef} className="w-full" />
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${status.includes('✓') ? 'bg-green-500' : status.includes('❌') ? 'bg-red-500' : 'bg-black/70'} text-white`}>{status}</span>
          </div>
        </div>
        <div className="mt-6 flex gap-4">
          <div className="bg-white rounded-lg px-6 py-3 text-center"><div className="text-2xl">✅</div><div className="text-sm">Today's Staff</div><div className="text-2xl font-bold text-green-600">{todayCount}</div></div>
          {lastMarked && (<div className="bg-white rounded-lg px-6 py-3 text-center"><div className="text-sm">Last Marked</div><div className="font-semibold">{lastMarked.name}</div><div className="text-xs">{new Date().toLocaleTimeString()}</div></div>)}
        </div>
      </div>
    </div>
  );
}