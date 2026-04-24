export interface MediaItem {
  type: "image" | "video" | "audio" | "link";
  url: string;
  title?: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  media: MediaItem[];
}

export interface Question {
  id: string;
  text: string;
  options: string[];
}

export interface QAQuestion {
  id: string;
  text: string;
  votes: number;
  uid: string;
  createdAt: number;
  color?: string;
}

export interface QAPage {
  id: string;
  title: string;
  createdAt: number;
}

export interface QACard {
  id: string;
  title: string;
  description: string;
  password?: string;
  uid: string;
  createdAt: number;
}

export interface MissionTemplate {
  id: string;
  cardTitle: string;
  mission: string;
  teamTask: string;
  example?: string;
}

export interface MissionCard {
  id: string;
  templateId: string;
  teamName?: string;
  password?: string;
  result?: string;
  media?: MediaItem[];
  status: "available" | "assigned" | "completed";
}

export interface MissionActivity {
  id: string;
  title: string;
  teamCount: number;
  joinedCount?: number;
  cards: MissionCard[];
  status: "active" | "closed";
  joinCode?: string;
  uid: string;
  createdAt: number;
  isVisible?: boolean;
}

export interface Poll {
  id: string;
  type: "general" | "popularity";
  title: string;
  questions: Question[];
  teams: Team[];
  status: "setup" | "voting" | "closed";
  joinCode?: string;
  hasPassword?: boolean;
  registrationCode?: string;
  deadline?: number;
  uid: string;
  createdAt: number;
  teamCount?: number;
  voteCount?: number;
  lastResetAt?: number;
  isVisible?: boolean;
}

export interface VoteResult {
  questionId: string;
  teamId?: string;
  optionIndex: number;
  count: number;
}

export interface User {
  id: string;
  email: string;
  role: "user" | "admin";
}

export type AppView = "home" | "create" | "vote" | "results" | "team-upload" | "admin" | "auth" | "qa" | "qa-detail" | "whiteboard";
