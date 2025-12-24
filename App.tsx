
import React, { useState, useEffect, useCallback } from 'react';
import { Difficulty, Challenge, Feedback, IterationState } from './types';
import { generateChallenge, validateSingleAnswer } from './services/geminiService';
import { 
  Database, 
  Code2, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Lightbulb, 
  RefreshCw,
  Award,
  BookOpen,
  Send,
  Eye,
  AlertCircle,
  Trophy,
  Layers
} from 'lucide-react';

const App: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.BEGINNER);
  const [state, setState] = useState<IterationState>({
    currentChallenge: null,
    userAnswers: { sql: '', orm: '' },
    feedback: { sql: null, orm: null },
    isValidating: { sql: false, orm: false },
    isAnswerRevealed: { sql: false, orm: false },
    isLoading: true,
    error: null
  });
  
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);
  const [score, setScore] = useState(0);

  const fetchNewChallenge = useCallback(async (targetDifficulty: Difficulty) => {
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      feedback: { sql: null, orm: null }, 
      userAnswers: { sql: '', orm: '' }, 
      isValidating: { sql: false, orm: false },
      isAnswerRevealed: { sql: false, orm: false },
      error: null 
    }));
    try {
      const challenge = await generateChallenge(targetDifficulty, completedTopics);
      setState(prev => ({ ...prev, currentChallenge: challenge, isLoading: false }));
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false, error: 'Failed to load challenge. Please check your API key or connection.' }));
    }
  }, [completedTopics]);

  useEffect(() => {
    fetchNewChallenge(difficulty);
  }, [difficulty]);

  const handleLevelChange = (newDifficulty: Difficulty) => {
    if (newDifficulty === difficulty) return;
    setDifficulty(newDifficulty);
  };

  const handleValidate = async (type: 'sql' | 'orm') => {
    if (!state.currentChallenge || !state.userAnswers[type]) return;
    
    setState(prev => ({ 
      ...prev, 
      isValidating: { ...prev.isValidating, [type]: true } 
    }));
    
    try {
      const feedback = await validateSingleAnswer(
        state.currentChallenge,
        state.userAnswers[type],
        type
      );
      
      setState(prev => ({ 
        ...prev, 
        feedback: { ...prev.feedback, [type]: feedback },
        isValidating: { ...prev.isValidating, [type]: false }
      }));
      
      if (feedback.isCorrect) {
        const points = difficulty === Difficulty.BEGINNER ? 5 : difficulty === Difficulty.INTERMEDIATE ? 10 : 20;
        setScore(s => s + points);
      }
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        isValidating: { ...prev.isValidating, [type]: false },
        error: `Validation for ${type.toUpperCase()} failed.` 
      }));
    }
  };

  const toggleRevealAnswer = (type: 'sql' | 'orm') => {
    setState(prev => ({
      ...prev,
      isAnswerRevealed: { ...prev.isAnswerRevealed, [type]: !prev.isAnswerRevealed[type] }
    }));
  };

  const handleNext = () => {
    if (state.currentChallenge) {
      setCompletedTopics(prev => [...prev, state.currentChallenge!.topic]);
    }
    fetchNewChallenge(difficulty);
  };

  const canGoNext = state.feedback.sql !== null && state.feedback.orm !== null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Database size={24} />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-slate-900 text-lg leading-tight">QueryMaster</h1>
              <p className="text-xs text-slate-500 font-medium">Django & SQL Mastery</p>
            </div>
          </div>

          {/* Manual Level Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            {Object.values(Difficulty).map((lvl) => (
              <button
                key={lvl}
                onClick={() => handleLevelChange(lvl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  difficulty === lvl 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Trophy size={10} /> Score
              </span>
              <span className="text-lg font-bold text-indigo-600 tabular-nums">{score}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700">
                <Layers size={18} className="text-indigo-500" />
                <h2 className="font-semibold">{difficulty} Challenge</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                  {state.currentChallenge?.topic || 'General'}
                </span>
              </div>
            </div>
            <div className="p-6">
              {state.isLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-64 bg-slate-100 rounded"></div>
                </div>
              ) : state.currentChallenge ? (
                <div className="space-y-6">
                  <div className="bg-indigo-50 border-l-4 border-indigo-500 p-5 rounded-r-lg shadow-sm">
                    <p className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                      <Lightbulb size={18} className="text-indigo-600" /> 
                      Prompt:
                    </p>
                    <p className="text-slate-700 leading-relaxed font-medium">{state.currentChallenge.question}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Database Schema</label>
                      <span className="text-[10px] text-slate-400 font-mono italic"># models.py</span>
                    </div>
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-xs border border-slate-800 shadow-inner whitespace-pre font-mono leading-relaxed">
                      <code>{state.currentChallenge.models}</code>
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
                  <p className="text-red-500 font-bold">{state.error || "An unexpected error occurred"}</p>
                  <button onClick={() => fetchNewChallenge(difficulty)} className="mt-4 text-indigo-600 font-bold flex items-center gap-2 mx-auto">
                    <RefreshCw size={16} /> Retry
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-1 gap-8">
            {/* SQL Input */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded">
                    <Database size={16} />
                  </div>
                  <h2 className="font-semibold text-slate-700">Raw SQL Solution</h2>
                </div>
                {state.feedback.sql && (
                  <FeedbackStatus isCorrect={state.feedback.sql.isCorrect} />
                )}
              </div>
              <div className="p-4 space-y-4">
                <textarea
                  value={state.userAnswers.sql}
                  onChange={(e) => {
                    const val = e.target.value;
                    setState(prev => ({ 
                      ...prev, 
                      userAnswers: { ...prev.userAnswers, sql: val },
                      feedback: { ...prev.feedback, sql: null },
                      isAnswerRevealed: { ...prev.isAnswerRevealed, sql: false }
                    }))
                  }}
                  disabled={state.isValidating.sql}
                  className="w-full h-32 p-4 bg-slate-900 text-emerald-400 font-mono text-sm rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all placeholder-slate-700 border border-slate-800"
                  placeholder={`SELECT ... FROM ${state.currentChallenge?.tableName || 'table_name'} ...`}
                />
                <div className="flex justify-end gap-3">
                  {state.feedback.sql && !state.feedback.sql.isCorrect && (
                    <button
                      onClick={() => toggleRevealAnswer('sql')}
                      className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                    >
                      <Eye size={14} /> {state.isAnswerRevealed.sql ? 'Hide Answer' : 'Show Solution'}
                    </button>
                  )}
                  <button
                    onClick={() => handleValidate('sql')}
                    disabled={state.isValidating.sql || !state.userAnswers.sql || !!state.feedback.sql?.isCorrect}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm"
                  >
                    {state.isValidating.sql ? (
                      <><RefreshCw size={14} className="animate-spin" /> Validating...</>
                    ) : state.feedback.sql?.isCorrect ? (
                      <><CheckCircle2 size={14} /> Validated</>
                    ) : (
                      <><Send size={14} /> Validate SQL</>
                    )}
                  </button>
                </div>
                <FeedbackCard data={state.feedback.sql} showAnswer={state.isAnswerRevealed.sql} />
              </div>
            </section>

            {/* Django ORM Input */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded">
                    <Code2 size={16} />
                  </div>
                  <h2 className="font-semibold text-slate-700">Django ORM Solution</h2>
                </div>
                {state.feedback.orm && (
                  <FeedbackStatus isCorrect={state.feedback.orm.isCorrect} />
                )}
              </div>
              <div className="p-4 space-y-4">
                <textarea
                  value={state.userAnswers.orm}
                  onChange={(e) => {
                    const val = e.target.value;
                    setState(prev => ({ 
                      ...prev, 
                      userAnswers: { ...prev.userAnswers, orm: val },
                      feedback: { ...prev.feedback, orm: null },
                      isAnswerRevealed: { ...prev.isAnswerRevealed, orm: false }
                    }))
                  }}
                  disabled={state.isValidating.orm}
                  className="w-full h-32 p-4 bg-slate-900 text-indigo-300 font-mono text-sm rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all placeholder-slate-700 border border-slate-800"
                  placeholder="MyModel.objects.filter(...)"
                />
                <div className="flex justify-end gap-3">
                  {state.feedback.orm && !state.feedback.orm.isCorrect && (
                    <button
                      onClick={() => toggleRevealAnswer('orm')}
                      className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                    >
                      <Eye size={14} /> {state.isAnswerRevealed.orm ? 'Hide Answer' : 'Show Solution'}
                    </button>
                  )}
                  <button
                    onClick={() => handleValidate('orm')}
                    disabled={state.isValidating.orm || !state.userAnswers.orm || !!state.feedback.orm?.isCorrect}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm"
                  >
                    {state.isValidating.orm ? (
                      <><RefreshCw size={14} className="animate-spin" /> Validating...</>
                    ) : state.feedback.orm?.isCorrect ? (
                      <><CheckCircle2 size={14} /> Validated</>
                    ) : (
                      <><Send size={14} /> Validate ORM</>
                    )}
                  </button>
                </div>
                <FeedbackCard data={state.feedback.orm} showAnswer={state.isAnswerRevealed.orm} />
              </div>
            </section>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-4">
               <div className="flex -space-x-2">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white text-white ${state.feedback.sql?.isCorrect ? 'bg-emerald-500 shadow-emerald-200 shadow-lg' : 'bg-slate-200'}`}>
                   <Database size={14} />
                 </div>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white text-white ${state.feedback.orm?.isCorrect ? 'bg-indigo-500 shadow-indigo-200 shadow-lg' : 'bg-slate-200'}`}>
                   <Code2 size={14} />
                 </div>
               </div>
               <p className="text-sm text-slate-500 font-medium">
                 {canGoNext ? "Both solutions verified!" : "Complete both validations to continue."}
               </p>
             </div>
             
             <button
                onClick={handleNext}
                disabled={!canGoNext || state.isLoading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
              >
                Next Challenge <ChevronRight size={20} />
              </button>
          </div>
        </div>
      </main>
      
      <footer className="py-6 text-center text-slate-400 text-xs font-medium border-t border-slate-200 mt-8">
        Learn Django ORM & SQL side-by-side with real-time AI guidance.
      </footer>
    </div>
  );
};

const FeedbackStatus: React.FC<{ isCorrect: boolean }> = ({ isCorrect }) => (
  <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
    {isCorrect ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
    {isCorrect ? 'Verified' : 'Review Required'}
  </div>
);

const FeedbackCard: React.FC<{ data: Feedback | null; showAnswer: boolean }> = ({ data, showAnswer }) => {
  if (!data) return null;
  return (
    <div className={`rounded-lg p-4 text-sm border animate-in fade-in duration-300 ${data.isCorrect ? 'bg-emerald-50/50 text-emerald-900 border-emerald-100' : 'bg-rose-50/50 text-rose-900 border-rose-100'}`}>
      <div className="flex gap-2 mb-2">
        {data.isCorrect ? (
          <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertCircle size={18} className="text-rose-500 flex-shrink-0 mt-0.5" />
        )}
        <div className="space-y-1">
          <span className="font-bold">Analysis:</span>
          <p className="leading-relaxed whitespace-pre-line">{data.explanation}</p>
        </div>
      </div>
      
      {showAnswer && !data.isCorrect && data.correctVersion && (
        <div className="mt-3 bg-white p-3 rounded-md border border-rose-100 animate-in fade-in slide-in-from-top-1 duration-200">
          <span className="font-bold text-[10px] uppercase block mb-1.5 text-rose-400 tracking-widest">Recommended Solution</span>
          <pre className="font-mono text-xs overflow-x-auto text-slate-800 whitespace-pre">
            {data.correctVersion}
          </pre>
        </div>
      )}

      {data.isCorrect && data.improvement && (
        <div className="mt-3 flex gap-2 items-start bg-emerald-100/30 p-3 rounded-md border border-emerald-100/50">
          <Award size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold block mb-0.5 text-emerald-700">Expert Tip:</span>
            <p className="italic text-emerald-800">{data.improvement}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
