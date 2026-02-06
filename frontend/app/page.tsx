'use client';

import { useState, useEffect } from 'react';
import { SessionControl } from '@/components/SessionControl';
import { SessionStatsDisplay } from '@/components/SessionStats';
import { CameraView } from '@/components/CameraView';
import { api } from '@/lib/api';

export default function Home() {
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);

  useEffect(() => {
    // Check for active session on mount
    const checkSession = async () => {
      try {
        const session = await api.getActiveSession();
        if (session) {
          setActiveSessionId(session.id);
        }
      } catch (err) {
        console.error('Failed to check active session:', err);
      }
    };

    checkSession();

    // Poll for active session every 10 seconds
    const interval = setInterval(checkSession, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
            Posture Monitor
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Real-time posture tracking for a healthier work life
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto mb-6">
          {/* Session Control */}
          <SessionControl onSessionChange={setActiveSessionId} />

          {/* Camera View */}
          <CameraView sessionId={activeSessionId} />
        </div>

        {/* Stats */}
        <div className="max-w-6xl mx-auto mb-6">
          <SessionStatsDisplay sessionId={activeSessionId} />
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mt-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">📸</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Real-time Detection
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Camera-based posture monitoring (coming soon with MediaPipe)
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">🔔</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Smart Alerts
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Get notified when slouching or sitting too long
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Analytics
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Track your posture habits over time
            </p>
          </div>
        </div>

        {/* API Status */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            API: <span className="text-green-600 font-semibold">Connected</span> •
            Backend: <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">API Docs</a>
          </p>
        </div>
      </main>
    </div>
  );
}


