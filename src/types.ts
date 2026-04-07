export interface Job {
  _id: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "candidate" | "admin";
}

export interface AuthState {
  token: string | null;
  user: User | null;
}

export interface AnalysisResult {
  score: number;
  summary: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string;
}

export interface AnalysisHistoryItem extends AnalysisResult {
  id: string;
  fileName: string;
  timestamp: number;
}
