'use client';

import { useRef, useEffect, useState } from 'react';

interface CameraViewProps {
  sessionId: number | null;
}

export function CameraView({ sessionId }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [cameraActive, setCameraActive] = useState(false);
  const [currentPosture, setCurrentPosture] = useState<string>('WAITING');
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // Start/stop analysis based on session
  useEffect(() => {
    if (sessionId && cameraActive) {
      startAnalysis();
    } else {
      stopAnalysis();
      setCurrentPosture('WAITING');
    }

    return () => stopAnalysis();
  }, [sessionId, cameraActive]);

  const startCamera = async () => {
    try {
      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });

      console.log('Camera stream obtained - active:', stream.active);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Set active immediately
        setCameraActive(true);
        setError(null);
        console.log('Camera set to active');
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setError(`Camera error: ${err.message}`);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    stopAnalysis();
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) return null;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.7);
  };

  const analyzeFrame = async () => {
    if (!sessionId || analyzing) return;

    const frame = captureFrame();
    if (!frame) return;

    setAnalyzing(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/posture/analyze-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, frame })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Posture:', result.posture_status);
        setCurrentPosture(result.posture_status);
      }
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const startAnalysis = () => {
    stopAnalysis();
    console.log('Starting analysis');
    setTimeout(() => analyzeFrame(), 1000);
    intervalRef.current = setInterval(() => analyzeFrame(), 2000);
  };

  const stopAnalysis = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const getPostureColor = (status: string) => {
    const colors: Record<string, string> = {
      GOOD: 'bg-green-500',
      SLOUCHING: 'bg-yellow-500',
      TOO_CLOSE: 'bg-red-500',
      NO_PERSON: 'bg-gray-500',
      WAITING: 'bg-blue-500'
    };
    return colors[status] || 'bg-gray-400';
  };

  const getPostureMessage = (status: string) => {
    const messages: Record<string, string> = {
      GOOD: '✅ Great posture!',
      SLOUCHING: '⚠️ Slouching detected',
      TOO_CLOSE: '🚫 Too close',
      NO_PERSON: '👤 No person',
      WAITING: sessionId ? '🔄 Analyzing...' : '⏸️ Start session'
    };
    return messages[status] || '...';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Live Camera
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          <p className="font-semibold">Error: {error}</p>
          <button
            onClick={() => { setError(null); startCamera(); }}
            className="mt-2 px-4 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
          >
            Retry
          </button>
        </div>
      )}

      <div className="relative mb-4 bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto"
          style={{ transform: 'scaleX(-1)' }}
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {cameraActive && (
          <div className="absolute top-4 left-4 right-4">
            <div className={`${getPostureColor(currentPosture)} text-white px-4 py-3 rounded-lg shadow-lg`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg">{currentPosture}</span>
                <span className="text-sm opacity-90">{getPostureMessage(currentPosture)}</span>
              </div>
            </div>
          </div>
        )}

        {!sessionId && cameraActive && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-gray-900 bg-opacity-75 text-white px-4 py-2 rounded-lg text-center">
              <p className="text-sm">Start a session to enable posture detection</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
          <span>Camera {cameraActive ? 'Active' : 'Inactive'}</span>
        </div>
        {sessionId && (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${analyzing ? 'bg-blue-500 animate-pulse' : 'bg-gray-500'}`}></div>
            <span>{analyzing ? 'Analyzing...' : 'Ready'}</span>
          </div>
        )}
      </div>
    </div>
  );
}
