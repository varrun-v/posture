'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface HistoryListProps {
    onSelectSession: (sessionId: number) => void;
    refreshTrigger: number; // Increment to reload
}

export function HistoryList({ onSelectSession, refreshTrigger }: HistoryListProps) {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadHistory();
    }, [refreshTrigger]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const data = await api.getSessionHistory();
            setSessions(data);
        } catch (error) {
            console.error('Failed to load history', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const getDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        return `${mins} min`;
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    History
                </h2>
                <button
                    onClick={loadHistory}
                    className="text-sm text-blue-600 hover:underline"
                >
                    Refresh
                </button>
            </div>

            {loading ? (
                <p className="text-gray-500">Loading history...</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b dark:border-gray-700">
                                <th className="pb-2 text-sm font-semibold text-gray-600 dark:text-gray-400">Date</th>
                                <th className="pb-2 text-sm font-semibold text-gray-600 dark:text-gray-400">Duration</th>
                                <th className="pb-2 text-sm font-semibold text-gray-600 dark:text-gray-400">Status</th>
                                <th className="pb-2 text-sm font-semibold text-gray-600 dark:text-gray-400">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {sessions.map((session) => (
                                <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                                    <td className="py-3 text-sm text-gray-800 dark:text-gray-300">
                                        {formatDate(session.started_at)}
                                    </td>
                                    <td className="py-3 text-sm text-gray-800 dark:text-gray-300">
                                        {session.total_duration_seconds ? getDuration(session.total_duration_seconds) : '-'}
                                    </td>
                                    <td className="py-3 text-sm">
                                        <span className={`px-2 py-1 rounded text-xs ${session.status === 'active'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {session.status}
                                        </span>
                                    </td>
                                    <td className="py-3 text-sm">
                                        <button
                                            onClick={() => onSelectSession(session.id)}
                                            className="text-indigo-600 hover:text-indigo-800 font-medium"
                                        >
                                            View Stats
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {sessions.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-4 text-center text-gray-500">No sessions found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
