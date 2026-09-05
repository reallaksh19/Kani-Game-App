import React, { useState } from 'react';
import { SpaceBackground } from '../shared/SpaceBackground';
import { Settings, Difficulty } from '../../types';
import { DEFAULT_SETTINGS } from '../../data/gameDefinitions';
import { useTheme, THEMES } from '../../contexts/ThemeContext';
import { MATH_GAMES, GRAMMAR_GAMES, SKILL_GAMES, EXAM_GAMES } from '../../data/gameDefinitions';

interface SettingsPageProps {
    settings: Settings;
    setSettings: (settings: Settings) => void;
    onBack: () => void;
}

// Theme Selector Component
function ThemeSelector() {
    const { themeIndex, setThemeByIndex } = useTheme();

    return (
        <div style={{ display: 'flex', gap: '8px' }}>
            {THEMES.map((theme, i) => (
                <button
                    key={theme.name}
                    onClick={() => setThemeByIndex(i)}
                    title={theme.name.charAt(0).toUpperCase() + theme.name.slice(1)}
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: `linear - gradient(135deg, ${theme.buttonGrad1}, ${theme.buttonGrad2})`,
                        border: themeIndex === i ? '3px solid #fff' : '2px solid rgba(255,255,255,0.3)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        transform: themeIndex === i ? 'scale(1.15)' : 'scale(1)',
                        boxShadow: themeIndex === i ? `0 0 15px ${theme.accent} ` : 'none',
                    }}
                />
            ))}
        </div>
    );
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ settings, setSettings, onBack }) => {
    const [localSettings, setLocalSettings] = useState(settings);
    const [password, setPassword] = useState('');
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [showUrls, setShowUrls] = useState(false);
    const [testingUrl, setTestingUrl] = useState<string | null>(null);

    const SETTINGS_PASSWORD = import.meta.env.VITE_SETTINGS_PASSWORD || 'Superdad';
    // Static version stamp for this build
    const versionStamp = `ver.26-05-24 time 15:30`;

    const handleUnlock = () => {
        if (password === SETTINGS_PASSWORD) {
            setIsUnlocked(true);
            setError('');
        } else {
            setError('Incorrect password');
            setPassword('');
        }
    };

    const testUrl = async (url: string, label: string) => {
        setTestingUrl(label);
        try {
            await fetch(url, { method: 'HEAD', mode: 'no-cors' });
            setSaveMessage(`✅ ${label} is accessible!`);
        } catch (e) {
            setSaveMessage(`⚠️ ${label} may not be accessible`);
        }
        setTimeout(() => {
            setSaveMessage('');
            setTestingUrl(null);
        }, 3000);
    };

    const handleSave = async () => {
        if (saving) return;
        setSaving(true);
        setSettings(localSettings);
        setSaveMessage('Settings saved!');
        setTimeout(() => setSaveMessage(''), 2000);
        setSaving(false);
        setTimeout(() => onBack(), 500);
    };

    const handleReset = () => {
        setLocalSettings(DEFAULT_SETTINGS);
        setSaveMessage('Settings reset to defaults');
        setTimeout(() => setSaveMessage(''), 2000);
    };

    if (!isUnlocked) {
        return (
            <SpaceBackground>
                <div className="flex flex-col items-center justify-center h-full px-4">
                    <button onClick={onBack} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-gray-900/80 flex items-center justify-center text-white hover:bg-gray-700 z-20 cursor-pointer">←</button>
                    <div className="text-6xl mb-4">🔒</div>
                    <h1 className="text-3xl font-bold text-white mb-2">Settings Locked</h1>
                    <p className="text-purple-300 mb-6 text-sm">Enter password to access settings</p>
                    <div className="w-full max-w-xs relative z-20">
                        <input
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                            className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-yellow-500 focus:outline-none mb-3"
                        />
                        {error && <p className="text-red-400 text-sm mb-3 text-center">{error}</p>}
                        <button onClick={handleUnlock} className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform cursor-pointer">
                            Unlock
                        </button>
                    </div>
                </div>
            </SpaceBackground>
        );
    }

    // Prepare topic configurations
    const topicConfigs = [
        { category: 'Math Games', games: MATH_GAMES, url: localSettings.mathSheetUrl },
        { category: 'Grammar Games', games: GRAMMAR_GAMES, url: localSettings.englishSheetUrl },
        { category: 'Skill Games', games: SKILL_GAMES, url: localSettings.skillSheetUrl },
        { category: 'Exam Games', games: EXAM_GAMES, url: localSettings.examSheetUrl || 'fraction-exam.csv' },
    ];

    return (
        <SpaceBackground>
            <div className="flex flex-col items-center h-full px-4 py-8 overflow-y-auto relative">
                <button onClick={onBack} aria-label="Back" className="absolute top-4 left-4 w-10 h-10 rounded-full bg-gray-900/80 flex items-center justify-center text-white hover:bg-gray-700 z-20 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white">←</button>
                <h1 className="text-4xl font-bold text-white mb-8 pt-8">⚙️ Settings</h1>

                {/* Success Message */}
                {saveMessage && (
                    <div style={{
                        position: 'fixed',
                        top: '20px',
                        right: '20px',
                        padding: '15px 25px',
                        background: 'linear-gradient(135deg, #4caf50, #8bc34a)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontWeight: 700,
                        zIndex: 1000,
                    }}>
                        {saveMessage}
                    </div>
                )}

                <div className="w-full max-w-2xl space-y-6 relative z-20 pb-8">
                    {/* Data Sources Section */}
                    <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">📚 Data Sources</h2>
                            <button
                                onClick={() => setShowUrls(!showUrls)}
                                className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors cursor-pointer text-sm"
                            >
                                {showUrls ? '🙈 Hide' : '👁️ Show'}
                            </button>
                        </div>

                        <div className="flex items-center justify-between py-2 border-b border-gray-700 mb-4 pb-4">
                            <div>
                                <span className="text-white font-bold">🌐 Use Google Sheets</span>
                                <p className="text-gray-400 text-xs mt-1">Enable to fetch questions from online sheets. Turn OFF to use local files.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={localSettings.useGoogleSheets}
                                    onChange={(e) => setLocalSettings({ ...localSettings, useGoogleSheets: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className={`space-y-4 ${!localSettings.useGoogleSheets ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                            <div>
                                <label className="block text-white font-bold mb-2 text-sm">🔢 Math Data URL</label>
                                <div className="flex gap-2">
                                    <input
                                        type={showUrls ? 'text' : 'password'}
                                        value={localSettings.mathSheetUrl}
                                        onChange={(e) => setLocalSettings({ ...localSettings, mathSheetUrl: e.target.value })}
                                        className="flex-1 px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-yellow-500 focus:outline-none text-sm"
                                    />
                                    <button
                                        onClick={() => testUrl(localSettings.mathSheetUrl, 'Math URL')}
                                        disabled={testingUrl === 'Math URL'}
                                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors cursor-pointer text-sm disabled:opacity-50"
                                    >
                                        {testingUrl === 'Math URL' ? '...' : 'Test'}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-white font-bold mb-2 text-sm">📖 English Data URL</label>
                                <div className="flex gap-2">
                                    <input
                                        type={showUrls ? 'text' : 'password'}
                                        value={localSettings.englishSheetUrl}
                                        onChange={(e) => setLocalSettings({ ...localSettings, englishSheetUrl: e.target.value })}
                                        className="flex-1 px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-yellow-500 focus:outline-none text-sm"
                                    />
                                    <button
                                        onClick={() => testUrl(localSettings.englishSheetUrl, 'English URL')}
                                        disabled={testingUrl === 'English URL'}
                                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors cursor-pointer text-sm disabled:opacity-50"
                                    >
                                        {testingUrl === 'English URL' ? '...' : 'Test'}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-white font-bold mb-2 text-sm">🧠 Skill Games Data URL</label>
                                <div className="flex gap-2">
                                    <input
                                        type={showUrls ? 'text' : 'password'}
                                        value={localSettings.skillSheetUrl}
                                        onChange={(e) => setLocalSettings({ ...localSettings, skillSheetUrl: e.target.value })}
                                        className="flex-1 px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-yellow-500 focus:outline-none text-sm"
                                    />
                                    <button
                                        onClick={() => testUrl(localSettings.skillSheetUrl, 'Skill URL')}
                                        disabled={testingUrl === 'Skill URL'}
                                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors cursor-pointer text-sm disabled:opacity-50"
                                    >
                                        {testingUrl === 'Skill URL' ? '...' : 'Test'}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-white font-bold mb-2 text-sm">📝 Exam Games Data URL</label>
                                <div className="flex gap-2">
                                    <input
                                        type={showUrls ? 'text' : 'password'}
                                        value={localSettings.examSheetUrl || ''}
                                        onChange={(e) => setLocalSettings({ ...localSettings, examSheetUrl: e.target.value })}
                                        className="flex-1 px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-yellow-500 focus:outline-none text-sm"
                                        placeholder="Optional: URL to CSV"
                                    />
                                    <button
                                        onClick={() => testUrl(localSettings.examSheetUrl || '', 'Exam URL')}
                                        disabled={testingUrl === 'Exam URL'}
                                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors cursor-pointer text-sm disabled:opacity-50"
                                    >
                                        {testingUrl === 'Exam URL' ? '...' : 'Test'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Topic Configuration */}
                    <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur">
                        <h2 className="text-xl font-bold text-white mb-4">📋 Topic Configuration</h2>
                        <div className="space-y-4">
                            {topicConfigs.map((config, i) => (
                                <div key={i} className="bg-gray-800/60 rounded-xl p-4 border border-gray-700">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-white font-bold text-lg">{config.category}</span>
                                        <span className="text-purple-400 text-sm">{config.games.length} games</span>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-start">
                                            <span className="text-gray-400 min-w-[80px]">📄 Source:</span>
                                            <span className="text-gray-300 break-all flex-1">{config.url}</span>
                                        </div>
                                        <div className="flex items-start">
                                            <span className="text-gray-400 min-w-[80px]">🎮 Games:</span>
                                            <span className="text-gray-300 flex-1">{config.games.map(g => g.title).join(', ')}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Gameplay Settings */}
                    <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur">
                        <h2 className="text-xl font-bold text-white mb-4">🎮 Gameplay Settings</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-white font-bold mb-2 text-sm">🎯 Default Difficulty</label>
                                <select
                                    value={localSettings.defaultDifficulty}
                                    onChange={(e) => setLocalSettings({ ...localSettings, defaultDifficulty: e.target.value as Difficulty })}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 cursor-pointer"
                                >
                                    <option value="None">None (Choose per game)</option>
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between py-2">
                                <div>
                                    <span className="text-white font-bold">🎚️ Enable Difficulty Screen</span>
                                    <p className="text-gray-400 text-xs mt-1">Show difficulty selector before games</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={localSettings.difficultyFilterEnabled}
                                        onChange={(e) => setLocalSettings({ ...localSettings, difficultyFilterEnabled: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between py-2">
                                <div>
                                    <span className="text-white font-bold">🔀 Randomize Questions</span>
                                    <p className="text-gray-400 text-xs mt-1">Shuffle question order</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={localSettings.randomize}
                                        onChange={(e) => setLocalSettings({ ...localSettings, randomize: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between py-2">
                                <div>
                                    <span className="text-white font-bold">👶 Kid Mode</span>
                                    <p className="text-gray-400 text-xs mt-1">Kid-friendly interface style</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={localSettings.kidMode}
                                        onChange={(e) => setLocalSettings({ ...localSettings, kidMode: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                                </label>
                            </div>
                            {/* Surprise Mode Toggle */}
                            <div className="flex items-center justify-between py-2 border-b border-gray-800/50">
                                <div>
                                    <span className="text-white font-bold flex items-center gap-2">🎲 Surprise Mode</span>
                                    <p className="text-gray-400 text-xs mt-1">Randomly lock/unlock games for a fresh challenge!</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={localSettings.surpriseMode}
                                        onChange={(e) => setLocalSettings({ ...localSettings, surpriseMode: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                                </label>
                            </div>
                        </div>

                        {/* Game Toggles (Visible if Surprise Mode is OFF) */}
                        {!localSettings.surpriseMode && (
                            <div className="mt-4 pt-4 border-t border-gray-700">
                                <h3 className="text-white font-bold mb-4">🎮 Enable/Disable Games</h3>
                                <div className="space-y-6">
                                    {topicConfigs.map((config, i) => (
                                        <div key={i}>
                                            <h4 className="text-purple-300 text-sm font-bold mb-2 uppercase">{config.category}</h4>
                                            <div className="space-y-2 pl-2">
                                                {config.games.map(game => (
                                                    <div key={game.id} className="flex items-center justify-between py-1">
                                                        <span className="text-gray-300 text-sm">{game.title}</span>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={localSettings.enabledGames?.[game.id] !== false}
                                                                onChange={(e) => setLocalSettings({
                                                                    ...localSettings,
                                                                    enabledGames: {
                                                                        ...localSettings.enabledGames,
                                                                        [game.id]: e.target.checked
                                                                    }
                                                                })}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Visual Settings */}
                    <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur">
                        <h2 className="text-xl font-bold text-white mb-4">🎨 Visual Settings</h2>
                        <div className="flex items-center justify-between">
                            <span className="text-white font-bold">Theme</span>
                            <ThemeSelector />
                        </div>
                    </div>

                    {/* Integration Settings */}
                    <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur">
                        <h2 className="text-xl font-bold text-white mb-4">📊 Integration</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-white font-bold mb-2 text-sm">Leaderboard URL</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="https://script.google.com/macros/s/..."
                                        value={localSettings.leaderboardUrl || ''}
                                        onChange={(e) => setLocalSettings({ ...localSettings, leaderboardUrl: e.target.value })}
                                        className="flex-1 px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-yellow-500 focus:outline-none text-sm"
                                    />
                                    {localSettings.leaderboardUrl && (
                                        <button
                                            onClick={() => testUrl(localSettings.leaderboardUrl, 'Leaderboard')}
                                            disabled={testingUrl === 'Leaderboard'}
                                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors cursor-pointer text-sm disabled:opacity-50"
                                        >
                                            {testingUrl === 'Leaderboard' ? '...' : 'Test'}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-white font-bold mb-2 text-sm">Settings Backup URL</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="https://script.google.com/macros/s/..."
                                        value={localSettings.settingsSheetUrl || ''}
                                        onChange={(e) => setLocalSettings({ ...localSettings, settingsSheetUrl: e.target.value })}
                                        className="flex-1 px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-yellow-500 focus:outline-none text-sm"
                                    />
                                    {localSettings.settingsSheetUrl && (
                                        <button
                                            onClick={() => testUrl(localSettings.settingsSheetUrl, 'Settings Backup')}
                                            disabled={testingUrl === 'Settings Backup'}
                                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors cursor-pointer text-sm disabled:opacity-50"
                                        >
                                            {testingUrl === 'Settings Backup' ? '...' : 'Test'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleReset}
                            className="flex-1 bg-gray-600 text-white px-6 py-4 rounded-full text-lg font-bold hover:bg-gray-500 transition-colors cursor-pointer"
                        >
                            🔄 Reset
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-full text-lg font-bold hover:scale-105 transition-transform shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {saving ? 'Saving...' : '💾 Save'}
                        </button>
                    </div>
                </div>

                {/* Version Stamp */}
                <div className="absolute bottom-2 right-4 text-[10px] text-gray-500 font-mono opacity-50">
                    {versionStamp}
                </div>
            </div>
        </SpaceBackground>
    );
};
