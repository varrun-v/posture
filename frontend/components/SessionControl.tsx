'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { Session } from '@/lib/types';

export function SessionControl() {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check for active session on mount
    useEffect(() => {
        checkActiveSession();
    }, []);

    const checkActiveSession = async () => {
        try {
            const activeSession = await api.getActiveSession();
            setSession(activeSession);
        } catch (err) {
            console.error('Failed to check active session:', err);
        }
    };

    const handleStart = async () => {
        setLoading(true);
        setError(null);
        try {
            const newSession = await api.startSession();
            setSession(newSession);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start session');
        } finally {
            setLoading(false);
        }
    };

    const handleStop = async () => {
        if (!session) return;

        setLoading(true);
        setError(null);
        try {
            await api.stopSession(session.id);
            setSession(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to stop session');
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return '0m';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const getSessionDuration = () => {
        if (!session) return 0;
        if (session.total_duration_seconds) return session.total_duration_seconds;

        const start = new Date(session.started_at).getTime();
        const now = Date.now();
        return Math.floor((now - start) / 1000);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                Monitoring Session
            </h2>

            {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
                    {error}
                </div>
            )}

            {session ? (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                            Session Active
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400">Session ID</p>
                            <p className="font-mono text-gray-900 dark:text-white">{session.id}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400">Duration</p>
                            <p className="font-mono text-gray-900 dark:text-white">
                                {formatDuration(getSessionDuration())}
                            </p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-gray-500 dark:text-gray-400">Started</p>
                            <p className="text-gray-900 dark:text-white">
                                {new Date(session.started_at).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleStop}
                        disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                        {loading ? 'Stopping...' : 'Stop Monitoring'}
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                        No active monitoring session. Start one to begin tracking your posture.
                    </p>

                    <button
                        onClick={handleStart}
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                        {loading ? 'Starting...' : 'Start Monitoring'}
                    </button>
                </div>
            )}
        </div>
    );
}
