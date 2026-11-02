export type GameMode = 'word' | 'quiz';
export type Locale = 'zh' | 'en';
export type RoomPhase =
  | 'LOBBY'
  | 'COUNTDOWN'
  | 'ROUND_INPUT'
  | 'ROUND_REVEAL'
  | 'GAME_FINISHED';

export type QuizCategory = 'life' | 'imagination' | 'personality';

export interface PlayerPublic {
  id: string;
  nickname: string;
  connected: boolean;
  isHost: boolean;
  submitted: boolean;
  locale: Locale;
}

export interface WordResult { playerId: string; nickname: string; answer: string | null }
export interface WordRound { round: number; results: WordResult[]; matched: boolean }

export interface LocalizedText { zh: string; en: string }
export interface QuizOption { id: 'A' | 'B' | 'C'; text: LocalizedText }
export interface QuizQuestion {
  id: string;
  category: QuizCategory;
  text: LocalizedText;
  options: QuizOption[];
}
export interface QuizReveal {
  questionId: string;
  question: QuizQuestion;
  answers: Array<{playerId: string; nickname: string; optionId: string | null}>;
  matched: boolean;
}

export interface RoomSnapshot {
  code: string;
  mode: GameMode;
  phase: RoomPhase;
  maxPlayers: 2 | 3 | 4;
  roundSeconds: number;
  hostId: string;
  players: PlayerPublic[];
  round: number;
  roundId: string;
  deadline: number | null;
  wordHistory: WordRound[];
  currentReveal: WordRound | null;
  finalWord: string | null;
  quizCategory: QuizCategory;
  quizTotal: 5 | 10 | 15;
  quizIndex: number;
  currentQuestion: QuizQuestion | null;
  quizHistory: QuizReveal[];
  compatibility: number | null;
}

export interface ServerToClientEvents {
  'room:snapshot': (snapshot: RoomSnapshot) => void;
  'room:error': (error: { code: string; message: string }) => void;
  'room:joined': (data: { code: string; playerId: string; sessionToken: string }) => void;
  'game:notice': (data: { type: string; message: string }) => void;
}

export interface ClientToServerEvents {
  'room:create': (payload: CreateRoomPayload, ack: Ack) => void;
  'room:join': (payload: JoinRoomPayload, ack: Ack) => void;
  'room:resume': (payload: ResumePayload, ack: Ack) => void;
  'room:leave': (payload: AuthPayload, ack: Ack) => void;
  'answer:submit': (payload: SubmitPayload, ack: Ack) => void;
  'game:start': (payload: AuthPayload, ack: Ack) => void;
  'game:restart': (payload: AuthPayload, ack: Ack) => void;
}

export interface CreateRoomPayload {
  nickname: string; mode: GameMode; maxPlayers: 2 | 3 | 4; roundSeconds: number;
  locale: Locale; quizCategory?: QuizCategory; quizTotal?: 5 | 10 | 15;
}
export interface JoinRoomPayload { code: string; nickname: string; locale: Locale }
export interface ResumePayload { code: string; playerId: string; sessionToken: string }
export interface AuthPayload { code: string; playerId: string; sessionToken: string }
export interface SubmitPayload extends AuthPayload { roundId: string; answer: string }
export type Ack = (result: { ok: true } | { ok: false; error: string }) => void;
