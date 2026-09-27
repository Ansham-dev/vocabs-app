export interface DeckInfo {
  _id: string;
  language: "korean" | "french";
  name: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  description: string | null;
  cardCount: number;
  dueCount: number | null;
}

export interface DueCard {
  _id: string;
  word: string;
  translation: string;
  exampleSentence: string | null;
  romanization: string | null;
  difficulty: string;
  isNew: boolean;
  repetitions: number;
}

export interface DayCount {
  date: string;
  count: number;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
}
