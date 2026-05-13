// app/components/FaceAttendance.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';

interface Student {
  id: string;
  name: string;
  faceDescriptor: number[];
  parentEmail: string;
}

export default function FaceAttendance() {
  const webcamRef = useRef<Webcam>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [status, setStatus] = useState('Loading...');
  const [recognizing, setRecognizing] = useState(false);
  const [lastAttendance, setLastAttendance] = useState<Student | null>(null);
  const [attendanceCount, setAttendanceCount] = useState(0);

  // Load face-api models on component mount
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.load(MODEL_URL),
        faceapi.nets.faceLandmark68Net.load(MODEL_URL),
        faceapi.nets.faceRecognitionNet.load(MODEL_URL),
      ]);
      setModelsLoaded(true);
      setStatus('Ready. Please look at the camera.');
    };
    loadModels();
  }, []);

  // Continuous recognition loop
  useEffect(() => {
    if (!modelsLoaded || recognizing) return;

    const interval = setInterval(() => {
      recognizeFace();
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [modelsLoaded, recognizing]);

  const recognizeFace = async () => {
    if (!webcamRef.current || recognizing) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setRecognizing(true);

    try {
      // 1. Get all students for this course from main portal
      const courseId = process.env.NEXT_PUBLIC_COURSE_ID;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MAIN_API_URL}/courses/${courseId}/students`
      );
      const students: Student[] = await response.json();

      if (students.length === 0) {
        setStatus('No students registered for this course');
        setRecognizing(false);
        return;
      }

      // 2. Load image and detect faces
      const img = await faceapi.fetchImage(imageSrc);
      const detections = await faceapi
        .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length === 0) {
        setStatus('No face detected. Please look at the camera.');
        setRecognizing(false);
        return;
      }

      // 3. Match detected faces with registered students
      for (const detection of detections) {
        const labeledDescriptors = students.map(student => 
          new faceapi.LabeledFaceDescriptors(
            student.id,
            [new Float32Array(student.faceDescriptor)]
          )
        );
        
        const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors);
        const bestMatch = faceMatcher.findBestMatch(detection.descriptor);

        if (bestMatch.distance < 0.6) { // Valid match
          const matchedStudent = students.find(s => s.id === bestMatch.label);
          
          if (matchedStudent) {
            // Mark attendance via main portal API
            const markResponse = await fetch(
              `${process.env.NEXT_PUBLIC_MAIN_API_URL}/attendance/mark`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  studentId: matchedStudent.id,
                  courseId,
                  deviceId: process.env.NEXT_PUBLIC_DEVICE_ID,
                  timestamp: new Date().toISOString(),
                }),
              }
            );

            if (markResponse.ok) {
              setStatus(`✓ Attendance marked for ${matchedStudent.name}`);
              setLastAttendance(matchedStudent);
              setAttendanceCount(prev => prev + 1);
              
              // Optional: Play success sound
              new Audio('/sounds/success.mp3').play();
              
              // Clear status after 2 seconds
              setTimeout(() => {
                setStatus('Ready. Next student please.');
              }, 2000);
            } else {
              const error = await markResponse.json();
              setStatus(`❌ Error: ${error.message}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Recognition error:', error);
      setStatus('Error occurred. Please try again.');
    } finally {
      setRecognizing(false);
    }
  };

  if (!modelsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">🎥</div>
          <p>Loading face recognition models...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Main Content */}
      <main className="flex flex-col items-center justify-center p-4">
        {/* Webcam Feed */}
        <div className="relative rounded-lg overflow-hidden shadow-2xl">
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full max-w-3xl rounded-lg"
            videoConstraints={{
              width: 1280,
              height: 720,
              facingMode: "user",
            }}
          />
          
          {/* Status Overlay */}
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <div className={`inline-block px-6 py-3 rounded-full text-lg font-semibold ${
              status.includes('✓') ? 'bg-green-500 text-white' :
              status.includes('❌') ? 'bg-red-500 text-white' :
              'bg-black bg-opacity-75 text-white'
            }`}>
              {status}
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full">
          <div className="bg-white rounded-lg p-4 shadow text-center">
            <div className="text-2xl mb-2">👥</div>
            <div className="text-sm text-gray-500">Today's Attendance</div>
            <div className="text-3xl font-bold text-green-600">{attendanceCount}</div>
          </div>
          
          {lastAttendance && (
            <div className="bg-white rounded-lg p-4 shadow text-center col-span-2">
              <div className="text-sm text-gray-500">Last Marked</div>
              <div className="text-xl font-semibold">{lastAttendance.name}</div>
              <div className="text-xs text-gray-400 mt-1">
                {new Date().toLocaleTimeString()}
              </div>
            </div>
          )}
        </div>

        {/* Manual Trigger Button (for testing) */}
        <button
          onClick={recognizeFace}
          disabled={recognizing}
          className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {recognizing ? 'Recognizing...' : 'Manual Check'}
        </button>

        {/* Instructions */}
        <div className="mt-8 text-sm text-gray-400 text-center max-w-md">
          <p>💡 Tips for best results:</p>
          <ul className="mt-2 space-y-1">
            <li>• Ensure good lighting on the face</li>
            <li>• Look directly at the camera</li>
            <li>• Remove masks or heavy accessories</li>
            <li>• Stay still for 2 seconds</li>
          </ul>
        </div>
      </main>
    </div>
  );
}