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
        // Poll less frequently for stats to avoid flickering
        const interval = setInterval(fetchStats, 5000);

        return () => clearInterval(interval);
    }, [sessionId]);

    if (!sessionId) return <EmptyState message="Start a session to see analytics" />;
    if (loading && !stats) return <EmptyState message="Loading insights..." />;
    if (!stats || stats.total_logs === 0) return <EmptyState message="No posture data yet. Camera detection starting..." />;

    const getScoreColor = (score: number = 0) => {
        if (score >= 80) return 'text-green-600 dark:text-green-400';
        if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all">
            {/* Header: Score & Core Metrics */}
            <div className="flex flex-col md:flex-row gap-6 mb-8 border-b border-gray-100 dark:border-gray-700 pb-6">
                {/* Hero Score */}
                <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-750 rounded-2xl">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Posture Score</span>
                    <div className="relative flex items-center justify-center mt-2">
                        <span className={`text-6xl font-bold ${getScoreColor(stats.score)}`}>
                            {stats.score ?? '-'}
                        </span>
                        <span className="text-2xl text-gray-400 ml-1">%</span>
                    </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="flex-[2] grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <MetricCard
                        label="Duration"
                        value={`${Math.round(stats.duration_minutes)} min`}
                        icon="⏱️"
                    />
                    <MetricCard
                        label="Slouch Time"
                        value={formatDuration(stats.slouch_metrics?.total_duration_seconds ?? 0)}
                        icon="📉"
                        alert={stats.slouch_metrics?.total_duration_seconds ? stats.slouch_metrics.total_duration_seconds > 300 : false}
                    />
                    <MetricCard
                        label="Max Slouch Streak"
                        value={formatDuration(stats.slouch_metrics?.longest_streak_seconds ?? 0)}
                        icon="⚠️"
                    />
                    <MetricCard
                        label="Data Points"
                        value={stats.total_logs.toString()}
                        icon="📊"
                    />
                    <MetricCard
                        label="Alerts Sent"
                        value={(stats.status_counts['SLOUCHING'] || 0).toString()}
                        icon="🔔"
                    />
                </div>
            </div>

            {/* Insight 1: Timeline (When do I mess up?) */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                    <span>📅</span> Session Timeline
                </h3>
                <div className="w-full h-12 flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    {stats.timeline?.map((point, i) => (
                        <div
                            key={i}
                            className={`flex-1 transition-colors ${point.status === 'GOOD' ? 'bg-green-400' :
                                    point.status === 'SLOUCHING' ? 'bg-yellow-400' :
                                        point.status === 'TOO_CLOSE' ? 'bg-red-400' : 'bg-gray-300'
                                }`}
                            title={`${new Date(point.time).toLocaleTimeString()} - ${point.status}`}
                        />
                    ))}
                    {(!stats.timeline || stats.timeline.length === 0) && (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">No timeline data</div>
                    )}
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
                    <span>Start</span>
                    <span>End</span>
                </div>
            </div>

            {/* Insight 2: Deep Insight Grid (Trend & Smart Recs) */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Trend Analysis */}
                <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-xl">
                    <h3 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-200">📈 Fatigue Trend</h3>
                    {stats.trend ? (
                        <div className="flex items-center justify-between">
                            <div className="text-center">
                                <p className="text-xs text-gray-500">First 25%</p>
                                <p className="text-xl font-bold text-gray-700 dark:text-gray-300">{stats.trend.start_score}%</p>
                            </div>
                            <div className="text-2xl text-gray-400">→</div>
                            <div className="text-center">
                                <p className="text-xs text-gray-500">Last 25%</p>
                                <p className="text-xl font-bold text-gray-700 dark:text-gray-300">{stats.trend.end_score}%</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-bold ${stats.trend.direction === 'improved' ? 'bg-green-100 text-green-700' :
                                    stats.trend.direction === 'worsened' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                {stats.trend.direction.toUpperCase()}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">Not enough data for trend analysis</p>
                    )}
                </div>

                {/* Smart Recommendations */}
                <div className="bg-blue-50 dark:bg-blue-900/30 p-5 rounded-xl border border-blue-100 dark:border-blue-800">
                    <h3 className="text-md font-bold mb-3 text-blue-800 dark:text-blue-300">💡 AI Insights</h3>
                    {stats.recommendations && stats.recommendations.length > 0 ? (
                        <ul className="space-y-2">
                            {stats.recommendations.map((rec, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-200">
                                    <span>•</span>
                                    <span>{rec}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-blue-600 dark:text-blue-400 italic">
                            No specific issues detected. Keep up the good work!
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// Sub-components
function EmptyState({ message }: { message: string }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-xl font-bold mb-2 text-gray-400">Session Analytics</h2>
            <p className="text-gray-500">{message}</p>
        </div>
    );
}

function MetricCard({ label, value, icon, alert }: { label: string, value: string, icon: string, alert?: boolean }) {
    return (
        <div className={`p-3 rounded-lg border ${alert ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100 dark:bg-gray-700 dark:border-gray-600'} shadow-sm`}>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex justify-between">
                {label} <span>{icon}</span>
            </div>
            <div className={`text-lg font-bold ${alert ? 'text-red-700' : 'text-gray-800 dark:text-white'}`}>
                {value}
            </div>
        </div>
    );
}
