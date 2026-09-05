import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { AVATAR_OPTIONS, AvatarOption } from '../../utils/studentProfiles';
import { StudentProfile } from '../../types';

interface StudentLoginScreenProps {
    onClose?: () => void;
    canClose?: boolean;
}

const GRADE_OPTIONS = [
    'Preschool',
    'Kindergarten',
    'Grade 1',
    'Grade 2',
    'Grade 3',
    'Grade 4',
    'Grade 5+'
];

export const StudentLoginScreen: React.FC<StudentLoginScreenProps> = ({ onClose, canClose = false }) => {
    const { studentProfiles, activeStudent, selectStudent, createStudent, deleteStudent } = useAppContext();

    const [isCreatingNew, setIsCreatingNew] = useState<boolean>(studentProfiles.length === 0);
    const [name, setName] = useState<string>('');
    const [selectedAvatar, setSelectedAvatar] = useState<AvatarOption>(AVATAR_OPTIONS[0]);
    const [selectedGrade, setSelectedGrade] = useState<string>('Grade 4');
    const [nameError, setNameError] = useState<string>('');

    const handleSelectExisting = async (profile: StudentProfile) => {
        await selectStudent(profile);
        if (onClose) onClose();
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            setNameError('Please type your name or nickname to begin!');
            return;
        }
        setNameError('');
        await createStudent(trimmed, selectedAvatar.emoji, selectedGrade);
        if (onClose) onClose();
    };

    const handleDeleteProfile = async (e: React.MouseEvent, id: string, profileName: string) => {
        e.stopPropagation();
        if (window.confirm(`Remove profile for "${profileName}"?`)) {
            await deleteStudent(id);
            if (studentProfiles.length <= 1) {
                setIsCreatingNew(true);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-500/20 text-white my-8">
                {/* Close Button (if switch profile modal) */}
                {canClose && onClose && (
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center text-xl transition-all cursor-pointer"
                    >
                        ✕
                    </button>
                )}

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-3xl shadow-lg shadow-indigo-500/30 mb-3 animate-bounce">
                        🚀
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-300 to-indigo-300">
                        {isCreatingNew ? 'Create Your Cadet Profile' : 'Welcome to Learning Galaxy!'}
                    </h1>
                    <p className="text-sm sm:text-base text-indigo-200/80 mt-1">
                        {isCreatingNew
                            ? 'Pick your cosmic avatar and type your name to blast off!'
                            : 'Choose who is exploring today or add a new cadet!'}
                    </p>
                </div>

                {/* Mode Switcher if profiles already exist */}
                {studentProfiles.length > 0 && (
                    <div className="flex bg-slate-800/80 p-1.5 rounded-2xl mb-6 max-w-sm mx-auto border border-white/10">
                        <button
                            type="button"
                            onClick={() => setIsCreatingNew(false)}
                            className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all ${
                                !isCreatingNew
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                                    : 'text-indigo-200/70 hover:text-white'
                            }`}
                        >
                            Existing Cadets ({studentProfiles.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsCreatingNew(true)}
                            className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all ${
                                isCreatingNew
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                                    : 'text-indigo-200/70 hover:text-white'
                            }`}
                        >
                            + New Cadet
                        </button>
                    </div>
                )}

                {/* MODE 1: Existing Cadets */}
                {!isCreatingNew && studentProfiles.length > 0 && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                            {studentProfiles.map((profile) => {
                                const isActive = activeStudent?.id === profile.id;
                                return (
                                    <div
                                        key={profile.id}
                                        onClick={() => handleSelectExisting(profile)}
                                        className={`group relative flex items-center gap-3.5 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                                            isActive
                                                ? 'bg-indigo-600/30 border-amber-400 shadow-lg shadow-amber-400/20'
                                                : 'bg-white/5 border-white/10 hover:border-indigo-400 hover:bg-white/10'
                                        }`}
                                    >
                                        <div className="text-4xl w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-900 to-slate-800 flex items-center justify-center shadow-inner border border-white/10 group-hover:scale-110 transition-transform">
                                            {profile.avatar}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-black text-lg text-white truncate group-hover:text-amber-300 transition-colors">
                                                    {profile.name}
                                                </h3>
                                                {isActive && (
                                                    <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-indigo-300/80">
                                                {profile.grade || 'Cadet'}
                                            </p>
                                        </div>
                                        {/* Delete profile option */}
                                        <button
                                            type="button"
                                            onClick={(e) => handleDeleteProfile(e, profile.id, profile.name)}
                                            aria-label={`Remove ${profile.name}`}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-300 text-xs transition-opacity"
                                            title="Remove profile"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="pt-2 text-center">
                            <button
                                type="button"
                                onClick={() => setIsCreatingNew(true)}
                                className="inline-flex items-center gap-2 text-sm font-bold text-amber-300 hover:text-amber-200 transition-colors py-2 px-4 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30"
                            >
                                <span>➕</span> Add Another Cadet
                            </button>
                        </div>
                    </div>
                )}

                {/* MODE 2: Create New Cadet */}
                {isCreatingNew && (
                    <form onSubmit={handleCreate} className="space-y-5">
                        {/* Name Field */}
                        <div>
                            <label className="block text-sm font-black text-indigo-200 mb-1.5">
                                What is your name or cadet code?
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (nameError) setNameError('');
                                }}
                                placeholder="e.g. Kani, Leo, Maya..."
                                autoFocus
                                maxLength={24}
                                className="w-full px-4 py-3 rounded-2xl bg-white/10 border-2 border-indigo-400/50 focus:border-amber-400 focus:outline-none text-white placeholder-white/30 text-lg font-bold transition-all shadow-inner"
                            />
                            {nameError && (
                                <p className="text-rose-400 text-xs mt-1.5 font-semibold flex items-center gap-1">
                                    ⚠️ {nameError}
                                </p>
                            )}
                        </div>

                        {/* Avatar Grid (12 options) */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-black text-indigo-200">
                                    Choose your cosmic avatar:
                                </label>
                                <span className="text-xs text-amber-300 font-bold">
                                    {selectedAvatar.emoji} {selectedAvatar.title} ({selectedAvatar.trait})
                                </span>
                            </div>
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-52 overflow-y-auto p-1 rounded-2xl bg-slate-900/60 border border-white/10">
                                {AVATAR_OPTIONS.map((opt) => {
                                    const isSelected = selectedAvatar.id === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setSelectedAvatar(opt)}
                                            className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                                                isSelected
                                                    ? 'bg-gradient-to-b from-indigo-600 to-purple-700 border-2 border-amber-400 scale-105 shadow-md shadow-amber-400/30'
                                                    : 'bg-white/5 border border-white/10 hover:bg-white/15 hover:scale-105'
                                            }`}
                                        >
                                            <span className="text-3xl mb-1 filter drop-shadow">
                                                {opt.emoji}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-200 truncate w-full text-center">
                                                {opt.title.split(' ')[1] || opt.title}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Grade Dropdown */}
                        <div>
                            <label className="block text-sm font-black text-indigo-200 mb-1.5">
                                Select Grade Level:
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {GRADE_OPTIONS.map((gr) => (
                                    <button
                                        key={gr}
                                        type="button"
                                        onClick={() => setSelectedGrade(gr)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                            selectedGrade === gr
                                                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                                                : 'bg-white/10 text-indigo-200 hover:bg-white/20'
                                        }`}
                                    >
                                        {gr}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-3">
                            <button
                                type="submit"
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 hover:from-amber-300 hover:via-orange-400 hover:to-pink-400 text-slate-950 font-black text-lg sm:text-xl tracking-wide shadow-xl shadow-orange-500/30 transform hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <span>Blast Off!</span>
                                <span className="text-2xl">{selectedAvatar.emoji}</span>
                                <span>🚀</span>
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};