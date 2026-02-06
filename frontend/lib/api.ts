const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_V1 = `${API_URL}/api/v1`;

// Default user ID for single-user mode
const DEFAULT_USER_ID = 1;

export const api = {
    // Users
    getUser: async (userId: number = DEFAULT_USER_ID) => {
        const res = await fetch(`${API_V1}/users/${userId}`);
        if (!res.ok) throw new Error('Failed to fetch user');
        return res.json();
    },

    getSettings: async (userId: number = DEFAULT_USER_ID) => {
        const res = await fetch(`${API_V1}/users/${userId}/settings`);
        if (!res.ok) throw new Error('Failed to fetch settings');
        return res.json();
    },

    updateSettings: async (userId: number = DEFAULT_USER_ID, settings: any) => {
        const res = await fetch(`${API_V1}/users/${userId}/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings),
        });
        if (!res.ok) throw new Error('Failed to update settings');
        return res.json();
    },

    // Sessions
    startSession: async (userId: number = DEFAULT_USER_ID) => {
        const res = await fetch(`${API_V1}/sessions/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId }),
        });
        if (!res.ok) throw new Error('Failed to start session');
        return res.json();
    },

    stopSession: async (sessionId: number) => {
        const res = await fetch(`${API_V1}/sessions/${sessionId}/stop`, {
            method: 'POST',
        });
        if (!res.ok) throw new Error('Failed to stop session');
        return res.json();
    },

    getSession: async (sessionId: number) => {
        const res = await fetch(`${API_V1}/sessions/${sessionId}`);
        if (!res.ok) throw new Error('Failed to fetch session');
        return res.json();
    },

    getActiveSession: async (userId: number = DEFAULT_USER_ID) => {
        const res = await fetch(`${API_V1}/sessions/user/${userId}/active`);
        if (!res.ok) return null;
        return res.json();
    },

    getSessionHistory: async (userId: number = DEFAULT_USER_ID) => {
        const res = await fetch(`${API_V1}/sessions/user/${userId}`);
        if (!res.ok) throw new Error('Failed to fetch session history');
        return res.json();
    },

    // Posture
    logPosture: async (data: {
        session_id: number;
        posture_status: string;
        neck_angle?: number;
        torso_angle?: number;
        distance_score?: number;
        confidence?: number;
    }) => {
        const res = await fetch(`${API_V1}/posture/log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to log posture');
        return res.json();
    },

    getCurrentPosture: async (sessionId: number) => {
        const res = await fetch(`${API_V1}/posture/session/${sessionId}/current`);
        if (!res.ok) throw new Error('Failed to fetch current posture');
        return res.json();
    },

    getSessionStats: async (sessionId: number) => {
        const res = await fetch(`${API_V1}/posture/session/${sessionId}/stats`);
        if (!res.ok) throw new Error('Failed to fetch session stats');
        return res.json();
    },

    getPostureHistory: async (sessionId: number, limit: number = 100) => {
        const res = await fetch(`${API_V1}/posture/session/${sessionId}/history?limit=${limit}`);
        if (!res.ok) throw new Error('Failed to fetch posture history');
        return res.json();
    },
};
