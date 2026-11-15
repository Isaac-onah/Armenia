import {
  ISSUE_BANNERS,
  SEED_BUBBLES,
  newId,
  nowIso,
  type Ballot,
  type Bubble,
  type Candidate,
  type Opinion,
  type Party,
  type Player,
  type Poll,
  type PollVote,
  type Room,
  type RoundResult,
  type Story,
} from './models';

export interface GameSnapshot {
  room: Room;
  players: Player[];
  parties: Party[];
  candidates: Candidate[];
  stories: Story[];
  opinions: Opinion[];
  bubbles: Bubble[];
  poll: Poll;
  pollVotes: PollVote[];
  ballots: Ballot[];
  result: RoundResult | null;
}

const MOCK_KEY = 'malta-quest-mock-room';

export function emptySnapshot(code = 'DEMO'): GameSnapshot {
  const roomId = 'room-demo';
  const internId = 'player-intern';
  const pressId = 'player-press';
  const peoplesParty = 'party-peoples';
  const democratsParty = 'party-democrats';
  const approvedStory = 'story-approved';

  const parties: Party[] = [
    {
      id: peoplesParty,
      roomId,
      slug: 'peoples',
      manifesto: '',
      slogan: '',
    },
    {
      id: democratsParty,
      roomId,
      slug: 'democrats',
      manifesto: '',
      slogan: '',
    },
  ];

  const stories: Story[] = [
    {
      id: approvedStory,
      roomId,
      authorId: pressId,
      title: 'Harbour lights stay on for the night market',
      body: 'City hall confirmed the waterfront lamps will stay lit until 11pm this week. Sticker: luzzu.',
      sticker: 'harbour',
      status: 'approved',
    },
  ];

  const bubbles: Bubble[] = SEED_BUBBLES.map((text, i) => ({
    id: `bubble-seed-${i}`,
    roomId,
    text,
    source: 'seed' as const,
    agreeCount: i === 1 ? 2 : 0,
    reportCount: 0,
    frozen: false,
  }));

  bubbles.push({
    id: 'bubble-tv-0',
    roomId,
    text: 'Harbour lights stay on for the night market',
    source: 'tv',
    agreeCount: 1,
    reportCount: 0,
    frozen: false,
  });

  return {
    room: {
      id: roomId,
      code,
      hostId: 'host-demo',
      status: 'lobby',
      issueBanner: ISSUE_BANNERS[0],
      startedAt: null,
      endsAt: null,
    },
    players: [
      {
        id: internId,
        roomId,
        userId: 'user-intern',
        alias: 'Desk intern',
        jersey: 'press',
        trust: 2,
      },
      {
        id: pressId,
        roomId,
        userId: 'user-press',
        alias: 'Harbour Herald',
        jersey: 'press',
        trust: 3,
      },
    ],
    parties,
    candidates: [],
    stories,
    opinions: [
      {
        id: 'op-1',
        roomId,
        storyId: approvedStory,
        playerId: internId,
        body: 'Finally. The square was too dark for the pastizzi stand.',
        hidden: false,
      },
    ],
    bubbles,
    poll: {
      id: 'poll-demo',
      roomId,
      prompt: ISSUE_BANNERS[0],
      kind: 'vote',
      status: 'open',
      options: ['Later nights', 'Earlier mornings', 'Leave it as-is'],
    },
    pollVotes: [],
    ballots: [],
    result: null,
  };
}

export function loadSnapshot(): GameSnapshot | null {
  try {
    const raw = localStorage.getItem(MOCK_KEY);
    if (!raw) return null;
    const snap = JSON.parse(raw) as GameSnapshot;
    const roomId = snap.room?.id ?? 'room-demo';
    const previous = snap.bubbles ?? [];
    const rest = previous.filter((b) => b.source !== 'seed');
    const seeds = SEED_BUBBLES.map((text, i) => {
      const prev = previous.find((b) => b.id === `bubble-seed-${i}`);
      return {
        id: `bubble-seed-${i}`,
        roomId,
        text,
        source: 'seed' as const,
        agreeCount: prev?.agreeCount ?? 0,
        reportCount: prev?.reportCount ?? 0,
        frozen: prev?.frozen ?? false,
      };
    });
    snap.bubbles = [...seeds, ...rest];
    saveSnapshot(snap);
    return snap;
  } catch {
    return null;
  }
}

export function saveSnapshot(snap: GameSnapshot): void {
  try {
    localStorage.setItem(MOCK_KEY, JSON.stringify(snap));
  } catch {
    /* ignore */
  }
}

export function resetSnapshot(code = 'DEMO'): GameSnapshot {
  const snap = emptySnapshot(code);
  saveSnapshot(snap);
  return snap;
}

export { nowIso, newId };
