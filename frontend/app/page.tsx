'use client';

import { useState, useEffect } from 'react';
import { SessionControl } from '@/components/SessionControl';
import { SessionStatsDisplay } from '@/components/SessionStats';
import { CameraView } from '@/components/CameraView';
import { HistoryList } from '@/components/HistoryList';
import { api } from '@/lib/api';

export default function Home() {
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [viewSessionId, setViewSessionId] = useState<number | null>(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  useEffect(() => {
    // Check for active session on mount
    const checkSession = async () => {
      try {
        const session = await api.getActiveSession();
        if (session) {
          setActiveSessionId(session.id);
          setViewSessionId(session.id); // Auto-view active session
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

  // Use this wrapper to update both active state and view
  const handleSessionChange = (id: number | null) => {
    setActiveSessionId(id);
    if (id) {
      setViewSessionId(id);
    }
    setHistoryRefresh(prev => prev + 1); // Refresh history list
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
            My Workspace Monitor
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Real-time posture tracking for a healthier work life
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto mb-6">
          {/* Session Control */}
          <SessionControl onSessionChange={handleSessionChange} />

          {/* Camera View */}
          <CameraView sessionId={activeSessionId} />
        </div>

        {/* Stats */}
        <div className="max-w-6xl mx-auto mb-6">
          <div className="mb-2 flex justify-between items-end">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              {activeSessionId === viewSessionId ? 'Live Stats' : 'Viewing Past Session Data'}
            </h3>
          </div>
          {/* Show stats for EITHER active session OR selected history item */}
          <SessionStatsDisplay sessionId={viewSessionId} />
        </div>

        {/* History */}
        <div className="max-w-6xl mx-auto mb-6">
          <HistoryList
            onSelectSession={(id) => setViewSessionId(id)}
            refreshTrigger={historyRefresh}
          />
        </div>

        {/* Status Section */}
        <div className="max-w-6xl mx-auto mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            API: <span className="text-green-600 font-semibold">Connected</span> •
            System: <span className="text-blue-600 font-semibold">Ready</span>
          </p>
        </div>
      </main>
    </div>
  );
}


