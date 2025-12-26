
export type Language = 'pt' | 'en';

export interface User {
  name: string;
  email: string;
  avatar: string;
  provider: 'google' | 'github' | 'email';
  verified?: boolean;
  points: number; 
  preferences?: string; 
}

export interface StoredAccount {
  email: string;
  password: string;
  name: string;
  points: number;
  preferences?: string;
}

export interface StudyFile {
  id: string;
  base64: string;
  mimeType: string;
  name: string;
}

export interface StudyContent {
  files: StudyFile[];
  text?: string;
  language: Language;
  userPreferences?: string;
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
  DASHBOARD = 'DASHBOARD',
  ANALYZING = 'ANALYZING',
  READY = 'READY',
  SUMMARY = 'SUMMARY',
  QUIZ = 'QUIZ',
  FLASHCARDS = 'FLASHCARDS',
  EXPLANATION = 'EXPLANATION',
  LIVE = 'LIVE',
  HISTORY = 'HISTORY',
  ADMIN = 'ADMIN'
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
  files: StudyFile[];
  text?: string;
  analysis: AnalysisResult;
}
