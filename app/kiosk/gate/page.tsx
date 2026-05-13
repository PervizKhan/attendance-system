'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';

declare global {
  interface Window {
    faceapi: any;
  }
}

interface Student {
  _id: string;
  studentId: string;
  name: string;
  className: string;
  faceDescriptor: number[];
  contactEmail: string;
}

export default function GateKiosk() {
  const webcamRef = useRef<Webcam>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [status, setStatus] = useState('Loading...');
  const [recognizing, setRecognizing] = useState(false);
  const [lastMarked, setLastMarked] = useState<{ name: string; className: string } | null>(null);
  const [todayCount, setTodayCount] = useState(0);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load face-api.js from CDN script
  useEffect(() => {
    // Check if already loaded
    if (window.faceapi) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
    script.async = true;
    script.onload = () => {
      console.log('Face-api.js script loaded');
      setScriptLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load face-api.js script');
      setStatus('Failed to load face recognition library');
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Load models after script is loaded - Using GitHub raw URLs
  useEffect(() => {
    if (!scriptLoaded || !window.faceapi) return;

    const loadModels = async () => {
      try {
        setStatus('Loading face recognition models...');
        
        // Use GitHub raw URLs for model weights (more reliable)
        const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
        
        await Promise.all([
          window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        
        setModelsLoaded(true);
        setStatus('Models loaded. Fetching students...');
        console.log('Face models loaded successfully');
      } catch (error) {
        console.error('Error loading face models:', error);
        setStatus('Failed to load face models. Please refresh.');
      }
    };
    
    loadModels();
  }, [scriptLoaded]);

  // Fetch all students with registered faces
  useEffect(() => {
    if (!modelsLoaded) return;
    
    const fetchStudents = async () => {
      try {
        const res = await fetch('/api/kiosk/all-students');
        const data = await res.json();
        setStudents(data);
        console.log(`Loaded ${data.length} students with registered faces`);
        
        if (data.length === 0) {
          setStatus('No students registered. Please add students first.');
        } else {
          setStatus('Ready. Please look at the camera.');
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        setStatus('Error loading student data.');
      }
    };
    
    fetchStudents();
  }, [modelsLoaded]);

  // Continuous recognition loop
  useEffect(() => {
    if (!modelsLoaded || students.length === 0 || recognizing || !window.faceapi) return;
    
    let interval: NodeJS.Timeout;
    
    const timer = setTimeout(() => {
      interval = setInterval(() => {
        recognizeFace();
      }, 3000);
    }, 2000);
    
    return () => {
      clearTimeout(timer);
      if (interval) clearInterval(interval);
    };
  }, [modelsLoaded, students, recognizing]);

  const recognizeFace = useCallback(async () => {
    if (!webcamRef.current || recognizing || students.length === 0 || !window.faceapi || !modelsLoaded) return;
    
    setRecognizing(true);
    
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        setRecognizing(false);
        return;
      }
      
      // Load image and detect face
      const img = await window.faceapi.fetchImage(imageSrc);
      const detection = await window.faceapi
        .detectSingleFace(img, new window.faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (detection && detection.descriptor) {
        // Build face matcher with all registered students
        const labeledDescriptors = students.map(student => {
          const descriptor = new Float32Array(student.faceDescriptor);
          return new window.faceapi.LabeledFaceDescriptors(student._id, [descriptor]);
        });
        
        const faceMatcher = new window.faceapi.FaceMatcher(labeledDescriptors);
        const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
        
        console.log('Match distance:', bestMatch.distance, 'Label:', bestMatch.label);
        
        if (bestMatch.distance < 0.6) {
          const matchedStudent = students.find(s => s._id === bestMatch.label);
          if (matchedStudent) {
            setStatus(`✓ Recognized: ${matchedStudent.name}`);
            
            // Mark attendance
            const res = await fetch('/api/kiosk/mark', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                studentId: matchedStudent._id,
                confidence: 1 - bestMatch.distance,
                location: 'school_gate',
              }),
            });
            
            const data = await res.json();
            
            if (res.ok) {
              setLastMarked({ 
                name: matchedStudent.name, 
                className: matchedStudent.className 
              });
              setTodayCount(prev => prev + 1);
              setStatus(`✓ Attendance marked for ${matchedStudent.name}`);
              
              // Play beep sound
              try {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                oscillator.frequency.value = 880;
                gainNode.gain.value = 0.1;
                oscillator.start();
                gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
                oscillator.stop(audioContext.currentTime + 0.5);
              } catch (e) {
                // Audio not supported
              }
              
              setTimeout(() => {
                if (status.includes(matchedStudent.name)) {
                  setStatus('Ready. Next student please.');
                }
              }, 3000);
            } else {
              setStatus(`❌ ${data.message || 'Failed to mark attendance'}`);
            }
          }
        } else {
          setStatus('Face not recognized. Please register first.');
        }
      } else {
        setStatus('Looking for face... Please look at camera.');
      }
    } catch (error) {
      console.error('Recognition error:', error);
      setStatus('Error occurred. Please try again.');
    } finally {
      setRecognizing(false);
    }
  }, [students, recognizing, modelsLoaded]);

  const handleManualRecognize = () => {
    if (!recognizing && modelsLoaded && students.length > 0) {
      setStatus('Manually triggered recognition...');
      recognizeFace();
    }
  };

  if (!scriptLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">📦</div>
          <p className="text-lg">Loading face recognition library...</p>
        </div>
      </div>
    );
  }

  if (!modelsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">🎥</div>
          <p className="text-lg">Loading face recognition models...</p>
          <p className="text-sm text-gray-400 mt-2">Downloading AI models (approx 10-15MB)</p>
          <div className="mt-4 w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-blue-900 text-white py-4 text-center">
        <h1 className="text-2xl font-bold">School Gate Attendance</h1>
        <p className="text-sm opacity-80 mt-1">Please look at the camera to mark attendance</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Webcam Feed */}
        <div className="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
          <Webcam
            ref={webcamRef}
            className="w-full"
            screenshotFormat="image/jpeg"
            videoConstraints={{
              width: { ideal: 480 },
              height: { ideal: 640 },
              facingMode: "user",
            }}
          />
          
          {/* Status Overlay */}
          <div className="absolute bottom-4 left-4 right-4 text-center">
            <div className={`inline-block px-4 py-3 rounded-xl text-base font-semibold w-full ${
              status.includes('✓') ? 'bg-green-500 text-white' :
              status.includes('❌') ? 'bg-red-500 text-white' :
              'bg-black/80 text-white'
            }`}>
              {status}
            </div>
          </div>
        </div>

        {/* Stats Display */}
        <div className="mt-6 grid grid-cols-2 gap-4 max-w-md w-full">
          <div className="bg-white rounded-xl p-3 text-center shadow-lg">
            <div className="text-3xl mb-1">✅</div>
            <div className="text-xs text-gray-500">Today's Attendance</div>
            <div className="text-2xl font-bold text-green-600">{todayCount}</div>
          </div>
          {lastMarked && (
            <div className="bg-white rounded-xl p-3 text-center shadow-lg">
              <div className="text-xs text-gray-500">Last Student</div>
              <div className="font-bold text-sm truncate">{lastMarked.name}</div>
              <div className="text-xs text-gray-400">{lastMarked.className}</div>
              <div className="text-xs text-green-600 mt-1">{new Date().toLocaleTimeString()}</div>
            </div>
          )}
        </div>

        {/* Manual Trigger Button */}
        <button
          onClick={handleManualRecognize}
          disabled={recognizing || !modelsLoaded || students.length === 0}
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {recognizing ? 'Recognizing...' : 'Test Recognition'}
        </button>

        {/* Student Count */}
        <div className="mt-4 text-center text-gray-500 text-sm">
          Registered students: {students.length}
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center text-gray-400 text-xs max-w-sm">
          <p>📱 Hold phone steady on stand</p>
          <p>👨‍🎓 Student should look directly at camera</p>
          <p>⏱️ Wait 2-3 seconds for recognition</p>
          <p className="mt-2 text-yellow-400">⚠️ Make sure the student's face is registered first</p>
        </div>
      </div>
    </div>
  );
}