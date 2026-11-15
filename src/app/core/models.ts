export type Jersey = 'wanderer' | 'press' | 'peoples' | 'democrats';
export type PlaceSlug = 'media' | 'civic' | 'peoples' | 'democrats' | 'square' | 'tv' | 'screen';
export type RoomStatus = 'lobby' | 'live' | 'recap';
export type StoryStatus = 'draft' | 'approved' | 'satire' | 'killed';
export type FactRating = 'run' | 'satire' | 'needs_source' | 'kill';
export type BubbleSource = 'tv' | 'manifesto' | 'seed' | 'rumour';
export type PollKind = 'vote' | 'cloud';
export type PollStatus = 'open' | 'closed';
export type ReportReason = 'harassment' | 'deepfake' | 'privacy' | 'unverified' | 'smear';
export type PartySlug = 'peoples' | 'democrats';

export interface Room {
  id: string;
  code: string;
  hostId: string;
  status: RoomStatus;
  issueBanner: string;
  startedAt: string | null;
  endsAt: string | null;
}

export interface Player {
  id: string;
  roomId: string;
  userId: string;
  alias: string;
  jersey: Jersey;
  trust: number;
}

export interface Party {
  id: string;
  roomId: string;
  slug: PartySlug;
  manifesto: string;
  slogan: string;
}

export interface Candidate {
  id: string;
  roomId: string;
  partyId: string;
  playerId: string;
  name: string;
  pitch: string;
}

export interface Story {
  id: string;
  roomId: string;
  authorId: string;
  title: string;
  body: string;
  sticker: string;
  status: StoryStatus;
}

export interface FactCheck {
  id: string;
  storyId: string;
  checkerId: string;
  rating: FactRating;
  note: string;
}

export interface Opinion {
  id: string;
  roomId: string;
  storyId: string;
  playerId: string;
  body: string;
  hidden: boolean;
}

export interface Bubble {
  id: string;
  roomId: string;
  text: string;
  source: BubbleSource;
  agreeCount: number;
  reportCount: number;
  frozen: boolean;
}

export interface Poll {
  id: string;
  roomId: string;
  prompt: string;
  kind: PollKind;
  status: PollStatus;
  options: string[];
}

export interface PollVote {
  id: string;
  pollId: string;
  playerId: string;
  value: string;
  hidden: boolean;
}

export interface Ballot {
  id: string;
  roomId: string;
  playerId: string;
  candidateId: string;
  hidden: boolean;
}

export interface RoundResult {
  id: string;
  roomId: string;
  winnerCandidateId: string | null;
  informedIsland: boolean;
}

export const ISSUE_BANNERS = [
  'Youth centre hours — later nights or earlier mornings?',
  'Golden Bay access — bus, bike lane, or leave it wild?',
  'Ferry timetable — more Sunday boats to Gozo?',
] as const;

export const SEED_BUBBLES = [
  "People's sound like the square. The Democrats talk past us. I trust the media about halfway.",
  "The Democrats feel steadier. People's keep shifting. The media still has to earn me.",
  "I like bits of both parties. Neither has the whole island. The media is confident, I am not.",
  "People's for the harbour, Democrats for the quiet towns. I check the media, then I check again.",
  "People's feel familiar. The Democrats feel far away. When the media is sure, I get careful.",
  "The Democrats make more sense to me today. People's lost me on the ferry. Low confidence in the media.",
  "Both parties are loud. I am not picking yet. The media is the only place I still look.",
  "People's promised the youth centre. The Democrats promised the boats. I do not trust the media to sort it.",
] as const;

export const STICKERS = [
  { id: 'luzzu', label: 'Luzzu' },
  { id: 'sun', label: 'Sun' },
  { id: 'harbour', label: 'Harbour' },
  { id: 'tv', label: 'TV set' },
  { id: 'pastizzi', label: 'Pastizzi' },
] as const;

export const PIN_DEFS: Record<
  Exclude<PlaceSlug, 'tv' | 'screen'>,
  { cx: number; cy: number; label: string; path: string }
> = {
  media: { cx: 740, cy: 660, label: 'Media house', path: 'media' },
  civic: { cx: 505, cy: 615, label: 'Civic hall', path: 'civic' },
  square: { cx: 480, cy: 455, label: 'Playground', path: 'square' },
  peoples: { cx: 650, cy: 590, label: "People's Party HQ", path: 'peoples' },
  democrats: { cx: 820, cy: 810, label: 'Democratic Party HQ', path: 'democrats' },
};

export function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Math.random().toString(36).slice(2, 10);
}

export function nowIso(): string {
  return new Date().toISOString();
}
