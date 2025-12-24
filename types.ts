
export enum Difficulty {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced'
}

export interface Challenge {
  id: string;
  models: string; // Django model definition string
  tableName: string; // Primary table name for SQL reference
  question: string;
  difficulty: Difficulty;
  topic: string;
}

export interface Feedback {
  isCorrect: boolean;
  explanation: string;
  correctVersion?: string;
  improvement?: string;
}

export interface ValidationFeedback {
  sql: Feedback | null;
  orm: Feedback | null;
}

export interface IterationState {
  currentChallenge: Challenge | null;
  userAnswers: { sql: string; orm: string };
  feedback: ValidationFeedback;
  isValidating: { sql: boolean; orm: boolean };
  isAnswerRevealed: { sql: boolean; orm: boolean };
  isLoading: boolean;
  error: string | null;
}
