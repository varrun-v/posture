'use client';

import { useRef, useEffect, useState } from 'react';

interface CameraViewProps {
  sessionId: number | null;
}

export function CameraView({ sessionId }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [currentPosture, setCurrentPosture] = useState<string>('WAITING');
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Start camera and WebSocket on mount
  useEffect(() => {
    startCamera();
    connectWebSocket();
    return () => {
      stopCamera();
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // WebSocket Connection
  const connectWebSocket = () => {
    try {
      const ws = new WebSocket('ws://localhost:8000/ws');

      ws.onopen = () => console.log('✅ WebSocket Connected');

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'NOTIFICATION') {
            // Handle Alerts (Slouching > 20s)
            setAlertMessage(data.message);
            // Auto-dismiss after 5 seconds
            setTimeout(() => setAlertMessage(null), 5000);
            return;
          }

          if (data.posture_status) {
            // Handle Posture Updates
            setCurrentPosture(data.posture_status);
            if (data.landmarks && canvasRef.current) {
              drawSkeleton(data.landmarks, data.posture_status);
            }
          }
        } catch (e) {
          console.error("WS Parse Error", e);
        }
      };

      ws.onclose = () => console.log('❌ WebSocket Disconnected');
      wsRef.current = ws;
    } catch (e) {
      console.error('WebSocket connection failed', e);
    }
  };

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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setError(null);
      }
    } catch (err: any) {
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

    // Don't set analyzing=true here to block because we want continuous stream
    // and the response is instant (202 Accepted)

    try {
      // Fire and forget (Async Mode)
      await fetch('http://localhost:8000/api/v1/posture/analyze-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, frame })
      });
      // We don't wait for result here anymore. 
      // Result comes via WebSocket.
    } catch (err) {
      console.error('Analysis error:', err);
    }
  };

  const drawSkeleton = (landmarks: any, status: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const color = status === 'GOOD' ? '#22c55e' : (status === 'SLOUCHING' ? '#eab308' : '#ef4444');
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    const points = landmarks;
    const getPoint = (idx: string) => {
      if (points[idx] && points[idx].presence > 0.5) {
        return { x: points[idx].x * canvas.width, y: points[idx].y * canvas.height };
      }
      return null;
    };

    const leftShoulder = getPoint('11');
    const rightShoulder = getPoint('12');
    const leftHip = getPoint('23');
    const rightHip = getPoint('24');
    const leftEar = getPoint('7');

    if (leftShoulder && rightShoulder && leftHip && rightHip) {
      const shoulderMid = {
        x: (leftShoulder.x + rightShoulder.x) / 2,
        y: (leftShoulder.y + rightShoulder.y) / 2
      };
      const hipMid = {
        x: (leftHip.x + rightHip.x) / 2,
        y: (leftHip.y + rightHip.y) / 2
      };

      // Spine
      ctx.beginPath();
      ctx.moveTo(shoulderMid.x, shoulderMid.y);
      ctx.lineTo(hipMid.x, hipMid.y);
      ctx.stroke();

      // Shoulders
      ctx.beginPath();
      ctx.moveTo(leftShoulder.x, leftShoulder.y);
      ctx.lineTo(rightShoulder.x, rightShoulder.y);
      ctx.stroke();

      // Hips
      ctx.beginPath();
      ctx.moveTo(leftHip.x, leftHip.y);
      ctx.lineTo(rightHip.x, rightHip.y);
      ctx.stroke();

      // Neck
      if (leftEar) {
        ctx.beginPath();
        ctx.moveTo(leftEar.x, leftEar.y);
        ctx.lineTo(shoulderMid.x, shoulderMid.y);
        ctx.stroke();
      }
    }
  };

  const startAnalysis = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    // Send frames more frequently now (async handles it)
    intervalRef.current = setInterval(() => analyzeFrame(), 500); // 2 FPS
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

      {/* Alert Overlay */}
      {alertMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-red-600 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <span className="font-bold text-lg">{alertMessage}</span>
          </div>
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
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ transform: 'scaleX(-1)' }}
        />

        {cameraActive && (
          <div className="absolute top-4 left-4 right-4 pointer-events-none">
            <div className={`${getPostureColor(currentPosture)} text-white px-4 py-3 rounded-lg shadow-lg pointer-events-auto`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg">{currentPosture}</span>
                <span className="text-sm opacity-90">{getPostureMessage(currentPosture)}</span>
              </div>
            </div>
          </div>
        )}

        {!sessionId && cameraActive && (
          <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
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
            <span>{analyzing ? 'Ready' : 'Analyzing (Async)...'}</span>
          </div>
        )}
      </div>
    </div>
  );
}
