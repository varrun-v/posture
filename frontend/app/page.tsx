'use client';

import { useState, useEffect } from 'react';
import { SessionControl } from '@/components/SessionControl';
import { SessionStatsDisplay } from '@/components/SessionStats';
import { CameraView } from '@/components/CameraView';
import { HistoryList } from '@/components/HistoryList';
import SettingsPage from '@/components/SettingsPage';
import { api } from '@/lib/api';

export default function Home() {
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [viewSessionId, setViewSessionId] = useState<number | null>(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

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
        <div className="relative text-center mb-8">
          <button
            onClick={() => setShowSettings(true)}
            className="absolute right-0 top-0 p-2 bg-white/50 hover:bg-white rounded-full transition-colors shadow-sm text-gray-600 hover:text-indigo-600"
            title="Settings"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
            My Workspace Monitor
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Real-time posture tracking for a healthier work life
          </p>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <SettingsPage
            userId={1} // Hardcoded for Demo MVP
            onClose={() => setShowSettings(false)}
          />
        )}

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


