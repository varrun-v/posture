export interface User {
    id: number;
    email: string;
    name: string;
    preferences: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface Session {
    id: number;
    user_id: number;
    started_at: string;
    ended_at: string | null;
    total_duration_seconds: number | null;
    status: 'active' | 'completed' | 'paused';
}

export interface PostureLog {
    id: number;
    session_id: number;
    timestamp: string;
    posture_status: 'GOOD' | 'SLOUCHING' | 'TOO_CLOSE' | 'NO_PERSON';
    neck_angle: number | null;
    torso_angle: number | null;
    distance_score: number | null;
    confidence: number | null;
}

export interface SessionStats {
    session_id: number;
    total_logs: number;
    duration_minutes: number;
    posture_breakdown: {
        GOOD?: number;
        SLOUCHING?: number;
        TOO_CLOSE?: number;
        NO_PERSON?: number;
    };
    status_counts: {
        GOOD?: number;
        SLOUCHING?: number;
        TOO_CLOSE?: number;
        NO_PERSON?: number;
    };
    session_status: string;
}

export interface CurrentPosture {
    session_id: number;
    current_status: string;
    last_updated: string;
    duration_in_current_state_seconds: number;
    neck_angle: number | null;
    torso_angle: number | null;
    distance_score: number | null;
    confidence: number | null;
}
