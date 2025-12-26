
export type Language = 'pt' | 'en';

export interface User {
  name: string;
  email: string;
  avatar: string;
  provider: 'google' | 'github' | 'email';
  verified?: boolean;
}

export interface StudyImage {
  id: string;
  base64: string;
  mimeType: string;
  name: string;
}

export interface StudyContent {
  images: StudyImage[];
  text?: string;
  language: Language;
}

export interface AnalysisResult {
  isStudyMaterial: boolean;
  topic: string;
  description: string;
  language: string;
  suggestion: string;
}

export enum StudyMode {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  READY = 'READY',
  SUMMARY = 'SUMMARY',
  QUIZ = 'QUIZ',
  FLASHCARDS = 'FLASHCARDS',
  EXPLANATION = 'EXPLANATION',
  LIVE = 'LIVE',
  HISTORY = 'HISTORY'
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface StudyHistoryEntry {
  id: string;
  date: number;
  topic: string;
  description: string;
  images: StudyImage[];
  text?: string;
  analysis: AnalysisResult;
}
