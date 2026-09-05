import { useState, useCallback } from 'react';
import { Question } from '../types';

interface CachedStory {
    storyId: string;
    passage: string;
    questions: Question[];
    currentQuestionIndex: number;
}

export const useStoryCache = () => {
    const [cachedStory, setCachedStory] = useState<CachedStory | null>(null);

    const loadStory = useCallback((storyId: string, passage: string, questions: Question[]) => {
        setCachedStory({
            storyId,
            passage,
            questions,
            currentQuestionIndex: 0
        });
    }, []);

    const nextQuestion = useCallback(() => {
        let hasMore = false;
        if (cachedStory && cachedStory.currentQuestionIndex < cachedStory.questions.length - 1) {
             setCachedStory(prev => prev ? {
                ...prev,
                currentQuestionIndex: prev.currentQuestionIndex + 1
            } : null);
            hasMore = true;
        }
        return hasMore;
    }, [cachedStory]);

    const clearCache = useCallback(() => {
        setCachedStory(null);
    }, []);

    return { cachedStory, loadStory, nextQuestion, clearCache };
};
