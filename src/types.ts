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
  cards: MissionCard[];
  status: "active" | "closed";
  joinCode?: string;
  createdAt: number;
}

export interface Poll {
  id: string;
  type: "general" | "popularity";
  title: string;
  questions: Question[];
  teams: Team[];
  status: "setup" | "voting" | "closed";
  joinCode: string;
  registrationCode: string;
  deadline?: number;
  createdAt: number;
}

export interface VoteResult {
  questionId: string;
  teamId?: string;
  optionIndex: number;
  count: number;
}

export type AppView = "home" | "create" | "vote" | "results" | "team-upload";
