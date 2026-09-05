import React from 'react';
import { Question, Feedback, ThemeConfig } from '../types';

interface RendererProps {
  currentQ: Question;
  handleAnswer: (selected: string, correct?: string) => void;
  feedback: Feedback | null;
  gameTheme: ThemeConfig;
}

// Enhanced Story Nebula Renderer with better typography and layout
export const StoryNebulaRenderer: React.FC<RendererProps> = ({ currentQ, handleAnswer, feedback, gameTheme }) => {
  const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[];

  return (
    <div className="w-full max-w-3xl">
      {/* Story Container with improved styling */}
      <div className={`${gameTheme.cardBg} backdrop-blur-sm rounded-2xl p-6 mb-6 border-2 ${gameTheme.borderColor} shadow-xl ${gameTheme.glowColor}`}>
        {/* Story Title with decorative element */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-teal-400/30">
          <span className="text-4xl">📖</span>
          <h3 className={`${gameTheme.storyTitleColor} font-bold text-2xl`}>
            {currentQ.text1}
          </h3>
        </div>

      </div>

      {/* Question Section with enhanced styling */}
      <div className={`${gameTheme.questionBg} backdrop-blur-sm rounded-2xl p-5 mb-6 border-2 border-teal-500/50 shadow-lg`}>
        <div className="flex items-start gap-3">
          <span className="text-3xl mt-1">❓</span>
          <div className="text-white text-xl font-semibold leading-relaxed">
            {currentQ.category === 'comprehension' ? currentQ.explanation : currentQ.category || currentQ.explanation}
          </div>
        </div>
      </div>

      {/* Answer Options with improved layout */}
      <div className="grid grid-cols-1 gap-3 relative z-20">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(opt, currentQ.answer)}
            className={`p-4 rounded-xl text-left font-medium text-lg transition-all transform hover:scale-102 hover:shadow-xl ${feedback
                ? opt === currentQ.answer
                  ? 'bg-green-500 text-white border-2 border-green-300 shadow-lg shadow-green-500/50'
                  : 'bg-gray-700 text-gray-400 border-2 border-gray-600'
                : `${gameTheme.buttonBg} text-white hover:brightness-110 border-2 ${gameTheme.borderColor}`
              }`}
          >
            <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
            {opt}
          </button>
        ))}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(34, 211, 238, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 211, 238, 0.7);
        }
      `}</style>
    </div>
  );
};

// Enhanced Inference Investigator Renderer with detective theme
export const InferenceInvestigatorRenderer: React.FC<RendererProps> = ({ currentQ, handleAnswer, feedback, gameTheme }) => {
  const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[];

  return (
    <div className="w-full max-w-3xl">
      {/* Clue/Evidence Container */}
      <div className={`${gameTheme.cardBg} backdrop-blur-sm rounded-2xl p-6 mb-6 border-2 ${gameTheme.borderColor} shadow-xl ${gameTheme.glowColor}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="text-5xl">🔍</div>
          <h3 className="text-violet-300 font-bold text-xl">Evidence to Investigate</h3>
        </div>
        <div className="bg-gray-900/50 rounded-xl p-5 border-2 border-violet-500/30">
          <p className="text-white text-xl leading-relaxed italic font-medium">
            "{currentQ.text1}"
          </p>
        </div>

        {/* Hint section styled as detective note */}
        {currentQ.hint && (
          <div className="mt-4 p-4 bg-yellow-100/10 border-l-4 border-yellow-400 rounded-r-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-yellow-400">📝</span>
              <span className="text-yellow-300 text-sm font-bold">Detective's Note:</span>
            </div>
            <p className="text-yellow-200 text-sm italic ml-6">
              {currentQ.hint}
            </p>
          </div>
        )}
      </div>

      {/* Question Section styled as case file */}
      <div className={`${gameTheme.questionBg} backdrop-blur-sm rounded-2xl p-5 mb-6 border-2 border-violet-500/50 shadow-lg`}>
        <div className="flex items-start gap-3">
          <span className="text-3xl">🔎</span>
          <div>
            <div className="text-violet-200 text-sm font-semibold mb-2 uppercase tracking-wide">
              Your Inference:
            </div>
            <div className="text-white text-xl font-semibold leading-relaxed">
              {currentQ.text2}
            </div>
          </div>
        </div>
      </div>

      {/* Answer Options styled as investigation choices */}
      <div className="grid grid-cols-1 gap-3 relative z-20">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(opt, currentQ.answer)}
            className={`p-4 rounded-xl text-left font-medium text-lg transition-all transform hover:scale-102 hover:shadow-xl group ${feedback
                ? opt === currentQ.answer
                  ? 'bg-green-500 text-white border-2 border-green-300 shadow-lg shadow-green-500/50'
                  : 'bg-gray-700 text-gray-400 border-2 border-gray-600'
                : `${gameTheme.buttonBg} text-white hover:brightness-110 border-2 ${gameTheme.borderColor}`
              }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-xl bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">{opt}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default {
  StoryNebulaRenderer,
  InferenceInvestigatorRenderer,
};
