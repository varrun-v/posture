'use client';

import { useRef, useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface CameraViewProps {
    sessionId: number | null;
    onPostureUpdate?: (status: string) => void;
}

export function CameraView({ sessionId, onPostureUpdate }: CameraViewProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isActive, setIsActive] = useState(false);
    const [currentPosture, setCurrentPosture] = useState<string>('UNKNOWN');
    const [error, setError] = useState<string | null>(null);
    const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

    useEffect(() => {
        if (sessionId && cameraPermission === 'granted') {
            startCamera();
        } else {
            stopCamera();
        }

        return () => stopCamera();
    }, [sessionId, cameraPermission]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsActive(true);
                setError(null);
                setCameraPermission('granted');

                // Start analyzing frames
                startFrameAnalysis();
            }
        } catch (err) {
            console.error('Camera error:', err);
            setError('Failed to access camera. Please grant camera permissions.');
            setCameraPermission('denied');
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setIsActive(false);
        }
    };

    const captureFrame = (): string | null => {
        if (!videoRef.current || !canvasRef.current) return null;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return null;

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64
        return canvas.toDataURL('image/jpeg', 0.8);
    };

    const startFrameAnalysis = () => {
        const analyzeInterval = setInterval(async () => {
            if (!sessionId || !isActive) {
                clearInterval(analyzeInterval);
                return;
            }

            const frame = captureFrame();
            if (!frame) return;

            try {
                // Send frame to backend for analysis
                const response = await fetch('http://localhost:8000/api/v1/posture/analyze-frame', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        session_id: sessionId,
                        frame: frame
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    setCurrentPosture(result.posture_status);
                    if (onPostureUpdate) {
                        onPostureUpdate(result.posture_status);
                    }
                }
            } catch (err) {
                console.error('Frame analysis error:', err);
            }
        }, 1000); // Analyze every 1 second

        return () => clearInterval(analyzeInterval);
    };

    const requestCameraPermission = async () => {
        await startCamera();
    };

    const getPostureColor = (status: string) => {
        switch (status) {
            case 'GOOD':
                return 'bg-green-500';
            case 'SLOUCHING':
                return 'bg-yellow-500';
            case 'TOO_CLOSE':
                return 'bg-red-500';
            case 'NO_PERSON':
                return 'bg-gray-500';
            default:
                return 'bg-gray-400';
        }
    };

    const getPostureMessage = (status: string) => {
        switch (status) {
            case 'GOOD':
                return 'Great posture! Keep it up! 👍';
            case 'SLOUCHING':
                return 'Slouching detected. Sit up straight! 🪑';
            case 'TOO_CLOSE':
                return 'Too close to screen. Move back! 📏';
            case 'NO_PERSON':
                return 'No person detected 👤';
            default:
                return 'Analyzing...';
        }
    };

    if (!sessionId) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                    Camera View
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Start a monitoring session to enable camera
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                Camera View
            </h2>

            {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
                    {error}
                </div>
            )}

            {cameraPermission === 'prompt' && (
                <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Camera access required for posture detection
                    </p>
                    <button
                        onClick={requestCameraPermission}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg"
                    >
                        Enable Camera
                    </button>
                </div>
            )}

            {cameraPermission === 'granted' && (
                <>
                    <div className="relative mb-4 bg-black rounded-lg overflow-hidden">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-auto transform -scale-x-100"
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Posture status overlay */}
                        <div className="absolute top-4 left-4 right-4">
                            <div className={`${getPostureColor(currentPosture)} text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2`}>
                                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                                <span className="font-semibold">{currentPosture}</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {getPostureMessage(currentPosture)}
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
