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
