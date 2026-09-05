import { useState, useEffect } from 'react';
import { Question } from '../types';
import { parseCSV } from '../utils/csvParser';

// API endpoint for skill games (placeholder - will be configured)
const SKILL_GAMES_API_URL = '';

// Google Sheet fallback URL for skill games
const SKILL_GAMES_SHEET_URL = '';

interface UseSkillGameDataReturn {
    data: Question[];
    loading: boolean;
    error: string | null;
    source: 'api' | 'sheet' | 'none';
}

/**
 * Hook to fetch skill game data with API-first approach
 * 1. Try API endpoint first
 * 2. Fall back to Google Sheet if API fails
 * 3. Return error if both fail (no static data)
 */
export const useSkillGameData = (
    gameType: string,
    difficulty?: string,
    apiUrl?: string,
    sheetUrl?: string
): UseSkillGameDataReturn => {
    const [data, setData] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [source, setSource] = useState<'api' | 'sheet' | 'none'>('none');

    useEffect(() => {
        if (!gameType) {
            setLoading(false);
            return;
        }

        let isMounted = true;
        setLoading(true);
        setError(null);

        const fetchFromAPI = async (): Promise<Question[] | null> => {
            const url = apiUrl || SKILL_GAMES_API_URL;
            if (!url) return null;

            try {
                const response = await fetch(`${url}?gameType=${gameType}&difficulty=${difficulty || ''}`);
                if (!response.ok) throw new Error('API request failed');
                const json = await response.json();
                return json.questions || json.data || json;
            } catch {
                console.log('API fetch failed, trying Google Sheet fallback...');
                return null;
            }
        };

        const fetchFromSheet = async (): Promise<Question[] | null> => {
            const url = sheetUrl || SKILL_GAMES_SHEET_URL;
            if (!url) return null;

            try {
                const response = await fetch(url);
                const csv = await response.text();
                const parsed = parseCSV(csv);
                return parsed.filter((row: Question) => {
                    const matchesGame = row.game_type === gameType;
                    const matchesDifficulty = !difficulty || row.difficulty === difficulty;
                    return matchesGame && matchesDifficulty;
                });
            } catch {
                console.log('Google Sheet fetch failed');
                return null;
            }
        };

        const fetchData = async () => {
            // Try API first
            let questions = await fetchFromAPI();
            if (questions && questions.length > 0) {
                if (isMounted) {
                    setData(questions);
                    setSource('api');
                    setLoading(false);
                }
                return;
            }

            // Try Google Sheet fallback
            questions = await fetchFromSheet();
            if (questions && questions.length > 0) {
                if (isMounted) {
                    setData(questions);
                    setSource('sheet');
                    setLoading(false);
                }
                return;
            }

            // Both failed - show error (no static data!)
            if (isMounted) {
                setError('Unable to load questions. Please check your connection or configure data sources.');
                setData([]);
                setSource('none');
                setLoading(false);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [gameType, difficulty, apiUrl, sheetUrl]);

    return { data, loading, error, source };
};

export default useSkillGameData;
