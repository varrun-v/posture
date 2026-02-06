'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { SessionStats } from '@/lib/types';

interface SessionStatsProps {
    sessionId: number | null;
}

export function SessionStatsDisplay({ sessionId }: SessionStatsProps) {
    const [stats, setStats] = useState<SessionStats | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!sessionId) {
            setStats(null);
            return;
        }

        const fetchStats = async () => {
            setLoading(true);
            try {
                const data = await api.getSessionStats(sessionId);
                setStats(data);
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 5000); // Update every 5 seconds

        return () => clearInterval(interval);
    }, [sessionId]);

    if (!sessionId) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                    Session Statistics
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Start a session to see statistics
                </p>
            </div>
        );
    }

    if (loading && !stats) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                    Session Statistics
                </h2>
                <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
        );
    }

    if (!stats || stats.total_logs === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                    Session Statistics
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    No posture data yet. Camera detection coming soon!
                </p>
            </div>
        );
    }

    const getPostureColor = (status: string) => {
        switch (status) {
            case 'GOOD':
                return 'bg-green-500';
            case 'SLOUCHING':
                return 'bg-yellow-500';
            case 'TOO_CLOSE':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                Session Statistics
            </h2>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {Math.round(stats.duration_minutes)} min
                        </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Data Points</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {stats.total_logs}
                        </p>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                        <span>📊</span> Posture Distribution
                    </h3>
                    <div className="space-y-4">
                        {Object.entries(stats.posture_breakdown).map(([status, percentage]) => (
                            <div key={status} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {status === 'GOOD' ? '✅ Good Posture' :
                                            status === 'SLOUCHING' ? '⚠️ Slouching' :
                                                status === 'TOO_CLOSE' ? '🚫 Too Close' : status}
                                    </span>
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        {percentage.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 rounded-full ${getPostureColor(status)}`}
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                        Insights
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg text-center">
                            <p className="text-xs text-blue-600 dark:text-blue-300 uppercase tracking-wide">Focus Time</p>
                            <p className="text-xl font-bold text-blue-800 dark:text-blue-100">
                                {Math.round(stats.duration_minutes)}m
                            </p>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-900 p-3 rounded-lg text-center">
                            <p className="text-xs text-yellow-600 dark:text-yellow-300 uppercase tracking-wide">Slouch Events</p>
                            <p className="text-xl font-bold text-yellow-800 dark:text-yellow-100">
                                {stats.status_counts['SLOUCHING'] || 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
