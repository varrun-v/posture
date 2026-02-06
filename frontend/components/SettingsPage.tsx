import { useState, useEffect } from 'react';
import { UserSettings } from '../lib/types';
import { api } from '../lib/api';

interface SettingsPageProps {
    userId: number;
    onClose: () => void;
}

// Default settings in case of network error (Optimistic UI)
const DEFAULT_SETTINGS: UserSettings = {
    blur_screenshots: true,
    enabled_evidence_locker: true,
    report_frequency: 1
};

export default function SettingsPage({ userId, onClose }: SettingsPageProps) {
    // Initialize with defaults so UI works immediately
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        fetchSettings();
    }, [userId]);

    const fetchSettings = async () => {
        try {
            const data = await api.getSettings(userId);
            setSettings(data);
            setErrorMsg('');
        } catch (error) {
            console.error('Failed to load settings:', error);
            setErrorMsg('Could not load settings from server. Using defaults.');
            // We keep the default settings state, so UI is still usable
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async (newSettings: UserSettings) => {
        setSaving(true);
        setSettings(newSettings); // Optimistic update
        try {
            await api.updateSettings(userId, newSettings);
            setSuccessMsg('Settings saved successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
            setErrorMsg('');
        } catch (error) {
            console.error('Failed to save settings:', error);
            setErrorMsg('Failed to save settings. Check network connection.');
            // Optional: Revert state if needed, but for now we keep optimistic state
        } finally {
            setSaving(false);
        }
    };

    const toggleBlur = () => {
        saveSettings({ ...settings, blur_screenshots: !settings.blur_screenshots });
    };

    const changeFrequency = (freq: number) => {
        saveSettings({ ...settings, report_frequency: freq });
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">⚙️ Settings</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-8">

                    {errorMsg && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {errorMsg}
                        </div>
                    )}

                    {/* Section 1: Privacy & Evidence */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Privacy & Evidence 🔒</h3>

                        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-100 flex gap-2">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <div>
                                <span className="font-semibold block mb-1">Evidence Locker Active</span>
                                Posture snapshots are automatically saved to help you track progress.
                            </div>
                        </div>

                        {/* Toggle: Blur Screenshots */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-800 flex items-center gap-2">
                                    Privacy Mode (Blur Faces)
                                    <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full">RECOMMENDED</span>
                                </p>
                                <p className="text-sm text-gray-500">Automatically redact facial features in saved evidence.</p>
                            </div>
                            <button
                                onClick={toggleBlur}
                                disabled={saving}
                                className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.blur_screenshots ? 'bg-indigo-600' : 'bg-gray-200'} ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${settings.blur_screenshots ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>
                    </div>

                    <hr />

                    {/* Section 2: Notifications */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Daily Reporting 📧</h3>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-800">Report Frequency</p>
                                <p className="text-sm text-gray-500">How often to receive email summaries.</p>
                            </div>
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                {[1, 2, 3].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => changeFrequency(num)}
                                        disabled={saving}
                                        className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${settings.report_frequency === num
                                            ? 'bg-white shadow text-indigo-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {num}x
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {successMsg && (
                        <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm text-center animate-in fade-in slide-in-from-bottom-2">
                            {successMsg}
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
