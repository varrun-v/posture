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
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                        Posture Breakdown
                    </h3>
                    <div className="space-y-2">
                        {Object.entries(stats.posture_breakdown).map(([status, percentage]) => (
                            <div key={status}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-700 dark:text-gray-300">{status}</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {percentage.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${getPostureColor(status)}`}
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
