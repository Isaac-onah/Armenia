import { Injectable, computed, signal } from '@angular/core';
import { AuthService } from './auth.service';
import {
  ISSUE_BANNERS,
  type Ballot,
  type Bubble,
  type Candidate,
  type FactRating,
  type Jersey,
  type Opinion,
  type Party,
  type PartySlug,
  type Player,
  type PollVote,
  type ReportReason,
  type Story,
} from './models';
import {
  emptySnapshot,
  loadSnapshot,
  newId,
  nowIso,
  resetSnapshot,
  saveSnapshot,
  type GameSnapshot,
} from './mock-store';
import { getSupabase, supabaseConfigured } from './supabase';

const WEEK_MS = 8 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class RoomService {
  private readonly snap = signal<GameSnapshot>(loadSnapshot() ?? emptySnapshot());

  readonly live = supabaseConfigured();
  readonly room = computed(() => this.snap().room);
  readonly players = computed(() => this.snap().players);
  readonly parties = computed(() => this.snap().parties);
  readonly candidates = computed(() => this.snap().candidates);
  readonly stories = computed(() => this.snap().stories);
  readonly drafts = computed(() => this.snap().stories.filter((s) => s.status === 'draft'));
  readonly approved = computed(() => this.snap().stories.filter((s) => s.status === 'approved'));
  readonly opinions = computed(() => this.snap().opinions.filter((o) => !o.hidden));
  readonly bubbles = computed(() => this.snap().bubbles);
  readonly poll = computed(() => this.snap().poll);
  readonly pollVotes = computed(() => this.snap().pollVotes);
  readonly ballots = computed(() => this.snap().ballots);
  readonly result = computed(() => this.snap().result);
  readonly me = computed(() => {
    const userId = this.auth.userId();
    return this.snap().players.find((p) => p.userId === userId) ?? null;
  });
  readonly mockMode = computed(() => !this.live);

  constructor(private readonly auth: AuthService) {}

  party(slug: PartySlug): Party | undefined {
    return this.snap().parties.find((p) => p.slug === slug);
  }

  candidatesFor(slug: PartySlug): Candidate[] {
    const party = this.party(slug);
    if (!party) return [];
    return this.snap().candidates.filter((c) => c.partyId === party.id);
  }

  pollTally(): { option: string; count: number }[] {
    const poll = this.snap().poll;
    const votes = this.snap().pollVotes.filter((v) => v.pollId === poll.id);
    return poll.options.map((option) => ({
      option,
      count: votes.filter((v) => v.value === option).length,
    }));
  }

  ballotTally(): { candidate: Candidate; party: Party; count: number }[] {
    const { candidates, parties, ballots } = this.snap();
    return candidates.map((candidate) => ({
      candidate,
      party: parties.find((p) => p.id === candidate.partyId)!,
      count: ballots.filter((b) => b.candidateId === candidate.id).length,
    }));
  }

  iVotedPoll(): boolean {
    const me = this.me();
    if (!me) return false;
    return this.snap().pollVotes.some((v) => v.playerId === me.id);
  }

  iVotedBallot(): boolean {
    const me = this.me();
    if (!me) return false;
    return this.snap().ballots.some((b) => b.playerId === me.id);
  }

  remainingMs(): number {
    const ends = this.snap().room.endsAt;
    if (!ends) return 0;
    return Math.max(0, new Date(ends).getTime() - Date.now());
  }

  async join(code: string, alias: string, jersey: Jersey): Promise<string> {
    const roomCode = (code || 'DEMO').trim().toUpperCase().slice(0, 4) || 'DEMO';
    await this.auth.ensureUser();
    this.auth.remember(alias, jersey);
    const userId = this.auth.userId()!;

    if (this.live) {
      const sb = getSupabase();
      if (sb) {
        const { data, error } = await sb.rpc('join_room', {
          p_code: roomCode,
          p_alias: alias.trim() || 'Harbour name',
          p_jersey: jersey,
        });
        if (!error && data) {
          await this.hydrateFromSupabase(roomCode);
          return roomCode;
        }
      }
    }

    this.patch((s) => {
      if (s.room.code !== roomCode) {
        const fresh = emptySnapshot(roomCode);
        Object.assign(s, fresh);
        s.room.code = roomCode;
      }
      const existing = s.players.find((p) => p.userId === userId);
      if (existing) {
        existing.alias = alias.trim() || existing.alias;
        existing.jersey = jersey;
      } else {
        s.players.push({
          id: newId(),
          roomId: s.room.id,
          userId,
          alias: alias.trim() || 'Harbour name',
          jersey,
          trust: 0,
        });
      }
    });
    return roomCode;
  }

  async hostNewRoom(banner: string): Promise<string> {
    await this.auth.ensureUser();
    const code = randomCode();
    if (this.live) {
      const sb = getSupabase();
      if (sb) {
        const { data, error } = await sb.rpc('start_room', {
          p_code: code,
          p_banner: banner,
        });
        if (!error && data) {
          await this.hydrateFromSupabase(code);
          return code;
        }
      }
    }
    const snap = resetSnapshot(code);
    snap.room.issueBanner = banner;
    snap.poll.prompt = banner;
    saveSnapshot(snap);
    this.snap.set(snap);
    return code;
  }

  useDemo(): void {
    const loaded = loadSnapshot();
    this.snap.set(loaded ?? emptySnapshot());
  }

  startWeek(): void {
    this.patch((s) => {
      s.room.status = 'live';
      s.room.startedAt = nowIso();
      s.room.endsAt = new Date(Date.now() + WEEK_MS).toISOString();
      s.result = null;
    });
    void this.rpc('start_week', { p_room_id: this.snap().room.id });
  }

  setBanner(banner: string): void {
    this.patch((s) => {
      s.room.issueBanner = banner;
      s.poll.prompt = banner;
    });
  }

  recap(): void {
    const tally = this.ballotTally().slice().sort((a, b) => b.count - a.count);
    const winner = tally[0]?.count ? tally[0].candidate.id : null;
    const checked = this.snap().stories.some((st) => st.status !== 'draft');
    const rumours = this.snap().bubbles.filter((b) => b.source === 'rumour');
    const rumourReports = rumours.reduce((n, b) => n + b.reportCount, 0);
    const rumourAgrees = rumours.reduce((n, b) => n + b.agreeCount, 0);
    const informed = checked && rumourReports >= rumourAgrees;
    this.patch((s) => {
      s.room.status = 'recap';
      s.result = {
        id: newId(),
        roomId: s.room.id,
        winnerCandidateId: winner,
        informedIsland: informed,
      };
    });
    void this.rpc('close_round', { p_room_id: this.snap().room.id });
  }

  resetWeek(): void {
    const code = this.snap().room.code;
    const banner = this.snap().room.issueBanner;
    const keepPlayers = this.snap().players;
    const snap = emptySnapshot(code);
    snap.room.issueBanner = banner;
    snap.poll.prompt = banner;
    snap.players = keepPlayers;
    saveSnapshot(snap);
    this.snap.set(snap);
  }

  uploadStory(title: string, body: string, sticker: string): void {
    const me = this.me();
    if (!me) return;
    const story: Story = {
      id: newId(),
      roomId: this.snap().room.id,
      authorId: me.id,
      title: title.trim(),
      body: body.trim(),
      sticker,
      status: 'draft',
    };
    this.patch((s) => s.stories.unshift(story));
    void this.tableInsert('stories', {
      id: story.id,
      room_id: story.roomId,
      author_id: story.authorId,
      title: story.title,
      body: story.body,
      sticker: story.sticker,
      status: story.status,
    });
  }

  factCheck(storyId: string, rating: FactRating, note = '', asIntern = false): string | null {
    const story = this.snap().stories.find((s) => s.id === storyId);
    if (!story) return 'No story.';
    const me = this.me();
    const intern = this.snap().players.find((p) => p.id === 'player-intern');
    const checker = asIntern ? intern : me;
    if (!checker) return 'Join the island first.';
    if (checker.id === story.authorId) return 'You cannot stamp your own story.';
    if (!asIntern && me && me.jersey !== 'press' && me.jersey !== 'wanderer') {
      /* anyone in the house may try; press is the intended jersey */
    }
    const status =
      rating === 'run' ? 'approved' : rating === 'kill' ? 'killed' : rating === 'satire' ? 'satire' : 'draft';
    this.patch((s) => {
      const row = s.stories.find((st) => st.id === storyId);
      if (row && rating !== 'needs_source') {
        row.status = status;
      }
      if (status === 'approved' && row) {
        s.bubbles.unshift({
          id: newId(),
          roomId: s.room.id,
          text: row.title,
          source: 'tv',
          agreeCount: 0,
          reportCount: 0,
          frozen: false,
        });
      }
      if (status === 'killed' && row) {
        s.bubbles.unshift({
          id: newId(),
          roomId: s.room.id,
          text: 'Heard that ' + row.title.toLowerCase() + '… wait, was that killed?',
          source: 'rumour',
          agreeCount: 0,
          reportCount: 0,
          frozen: false,
        });
      }
    });
    void this.rpc('fact_check_story', {
      p_story_id: storyId,
      p_rating: rating,
      p_note: note,
    });
    return null;
  }

  addOpinion(storyId: string, body: string): void {
    const me = this.me();
    if (!me || !body.trim()) return;
    const row: Opinion = {
      id: newId(),
      roomId: this.snap().room.id,
      storyId,
      playerId: me.id,
      body: body.trim(),
      hidden: false,
    };
    this.patch((s) => s.opinions.unshift(row));
  }

  saveManifesto(slug: PartySlug, manifesto: string, slogan: string): string | null {
    const me = this.me();
    if (!me) return 'Join first.';
    if (me.jersey !== slug) {
      return `Read-only — only ${slug === 'peoples' ? "People's Party" : 'Democratic Party'} jerseys may file here.`;
    }
    this.patch((s) => {
      const party = s.parties.find((p) => p.slug === slug);
      if (party) {
        party.manifesto = manifesto.slice(0, 280);
        party.slogan = slogan.slice(0, 80);
        s.bubbles.unshift({
          id: newId(),
          roomId: s.room.id,
          text: party.slogan || party.manifesto.slice(0, 60),
          source: 'manifesto',
          agreeCount: 0,
          reportCount: 0,
          frozen: false,
        });
      }
    });
    const party = this.party(slug);
    void this.tableUpsert('parties', {
      id: party?.id,
      room_id: this.snap().room.id,
      slug,
      manifesto: manifesto.slice(0, 280),
      slogan: slogan.slice(0, 80),
    });
    return null;
  }

  addCandidate(slug: PartySlug, name: string, pitch: string): string | null {
    const me = this.me();
    if (!me) return 'Join first.';
    if (me.jersey !== slug) {
      return `Read-only — pick the ${slug} jersey on the landing dock.`;
    }
    const party = this.party(slug);
    if (!party) return 'Party missing.';
    if (!name.trim() || !pitch.trim()) return 'Name and pitch, both.';
    if (this.candidatesFor(slug).length >= 3) return 'Cap is 3 candidates.';
    const row: Candidate = {
      id: newId(),
      roomId: this.snap().room.id,
      partyId: party.id,
      playerId: me.id,
      name: name.trim(),
      pitch: pitch.trim(),
    };
    this.patch((s) => s.candidates.push(row));
    void this.tableInsert('candidates', {
      id: row.id,
      room_id: row.roomId,
      party_id: row.partyId,
      player_id: row.playerId,
      name: row.name,
      pitch: row.pitch,
    });
    return null;
  }

  votePoll(value: string): string | null {
    const me = this.me();
    if (!me) return 'Join first.';
    if (this.iVotedPoll()) return 'Already voted.';
    const vote: PollVote = {
      id: newId(),
      pollId: this.snap().poll.id,
      playerId: me.id,
      value,
      hidden: false,
    };
    this.patch((s) => s.pollVotes.push(vote));
    return null;
  }

  grantTrust(amount: number): void {
    const userId = this.auth.userId();
    if (!userId || amount <= 0) return;
    this.patch((s) => {
      const me = s.players.find((p) => p.userId === userId);
      if (me) me.trust = Math.min(20, me.trust + amount);
    });
  }

  castBallot(candidateId: string): string | null {
    const me = this.me();
    if (!me) return 'Join first.';
    if (this.iVotedBallot()) return 'One vote per harbour name.';
    const ballot: Ballot = {
      id: newId(),
      roomId: this.snap().room.id,
      playerId: me.id,
      candidateId,
      hidden: true,
    };
    this.patch((s) => s.ballots.push(ballot));
    void this.rpc('cast_ballot', {
      p_room_id: this.snap().room.id,
      p_candidate_id: candidateId,
    });
    return null;
  }

  reactBubble(id: string, kind: 'agree' | 'report', reason?: ReportReason): void {
    this.patch((s) => {
      const b = s.bubbles.find((x) => x.id === id);
      if (!b || b.frozen) return;
      if (kind === 'agree') b.agreeCount += 1;
      if (kind === 'report') {
        b.reportCount += 1;
        if (b.reportCount >= 2) b.frozen = true;
      }
      void reason;
    });
    if (kind === 'agree') void this.rpc('agree_bubble', { p_bubble_id: id });
    if (kind === 'report') void this.rpc('report_bubble', { p_bubble_id: id, p_reason: reason ?? 'unverified' });
  }

  rumourTint(): boolean {
    const rumours = this.snap().bubbles.filter((b) => b.source === 'rumour' && !b.frozen);
    const rest = this.snap().bubbles.filter((b) => b.source !== 'rumour' || b.frozen);
    return rumours.length > rest.length && rumours.length > 0;
  }

  playerAlias(id: string): string {
    return this.snap().players.find((p) => p.id === id)?.alias ?? 'Someone';
  }

  private patch(mut: (s: GameSnapshot) => void): void {
    const next = structuredClone(this.snap());
    mut(next);
    saveSnapshot(next);
    this.snap.set(next);
  }

  private async rpc(name: string, args: Record<string, unknown>): Promise<void> {
    if (!this.live) return;
    const sb = getSupabase();
    if (!sb) return;
    await sb.rpc(name, args);
  }

  private async tableInsert(table: string, row: Record<string, unknown>): Promise<void> {
    if (!this.live) return;
    const sb = getSupabase();
    if (!sb) return;
    await sb.from(table).insert(row);
  }

  private async tableUpsert(table: string, row: Record<string, unknown>): Promise<void> {
    if (!this.live) return;
    const sb = getSupabase();
    if (!sb) return;
    await sb.from(table).upsert(row);
  }

  private async hydrateFromSupabase(code: string): Promise<void> {
    const sb = getSupabase();
    if (!sb) return;
    const { data: rooms } = await sb.from('rooms').select('*').eq('code', code).limit(1);
    const room = rooms?.[0];
    if (!room) return;
    const roomId = room.id as string;
    const [players, parties, candidates, stories, opinions, bubbles, polls, pollVotes, ballots, results] =
      await Promise.all([
        sb.from('players').select('*').eq('room_id', roomId),
        sb.from('parties').select('*').eq('room_id', roomId),
        sb.from('candidates').select('*').eq('room_id', roomId),
        sb.from('stories').select('*').eq('room_id', roomId),
        sb.from('opinions').select('*').eq('room_id', roomId),
        sb.from('bubbles').select('*').eq('room_id', roomId),
        sb.from('polls').select('*').eq('room_id', roomId),
        sb.from('poll_votes').select('*'),
        sb.from('ballots').select('*').eq('room_id', roomId),
        sb.from('round_results').select('*').eq('room_id', roomId),
      ]);
    const pollRow = polls.data?.[0];
    const snap: GameSnapshot = {
      room: {
        id: roomId,
        code: room.code,
        hostId: room.host_id,
        status: room.status,
        issueBanner: room.issue_banner,
        startedAt: room.started_at,
        endsAt: room.ends_at,
      },
      players: (players.data ?? []).map(mapPlayer),
      parties: (parties.data ?? []).map(mapParty),
      candidates: (candidates.data ?? []).map(mapCandidate),
      stories: (stories.data ?? []).map(mapStory),
      opinions: (opinions.data ?? []).map(mapOpinion),
      bubbles: (bubbles.data ?? []).map(mapBubble),
      poll: pollRow
        ? {
            id: pollRow.id,
            roomId,
            prompt: pollRow.prompt,
            kind: pollRow.kind,
            status: pollRow.status,
            options: ['Later nights', 'Earlier mornings', 'Leave it as-is'],
          }
        : emptySnapshot().poll,
      pollVotes: (pollVotes.data ?? []).map(mapPollVote),
      ballots: (ballots.data ?? []).map(mapBallot),
      result: results.data?.[0]
        ? {
            id: results.data[0].id,
            roomId,
            winnerCandidateId: results.data[0].winner_candidate_id,
            informedIsland: results.data[0].informed_island,
          }
        : null,
    };
    saveSnapshot(snap);
    this.snap.set(snap);
  }
}

function randomCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let s = '';
  for (let i = 0; i < 4; i++) s += letters[Math.floor(Math.random() * letters.length)];
  return s;
}

function mapPlayer(r: Record<string, unknown>): Player {
  return {
    id: r['id'] as string,
    roomId: r['room_id'] as string,
    userId: r['user_id'] as string,
    alias: r['alias'] as string,
    jersey: r['jersey'] as Jersey,
    trust: (r['trust'] as number) ?? 0,
  };
}
function mapParty(r: Record<string, unknown>): Party {
  return {
    id: r['id'] as string,
    roomId: r['room_id'] as string,
    slug: r['slug'] as PartySlug,
    manifesto: (r['manifesto'] as string) ?? '',
    slogan: (r['slogan'] as string) ?? '',
  };
}
function mapCandidate(r: Record<string, unknown>): Candidate {
  return {
    id: r['id'] as string,
    roomId: r['room_id'] as string,
    partyId: r['party_id'] as string,
    playerId: r['player_id'] as string,
    name: r['name'] as string,
    pitch: r['pitch'] as string,
  };
}
function mapStory(r: Record<string, unknown>): Story {
  return {
    id: r['id'] as string,
    roomId: r['room_id'] as string,
    authorId: r['author_id'] as string,
    title: r['title'] as string,
    body: r['body'] as string,
    sticker: (r['sticker'] as string) ?? '',
    status: r['status'] as Story['status'],
  };
}
function mapOpinion(r: Record<string, unknown>): Opinion {
  return {
    id: r['id'] as string,
    roomId: r['room_id'] as string,
    storyId: r['story_id'] as string,
    playerId: r['player_id'] as string,
    body: r['body'] as string,
    hidden: Boolean(r['hidden']),
  };
}
function mapBubble(r: Record<string, unknown>): Bubble {
  return {
    id: r['id'] as string,
    roomId: r['room_id'] as string,
    text: r['text'] as string,
    source: r['source'] as Bubble['source'],
    agreeCount: (r['agree_count'] as number) ?? 0,
    reportCount: (r['report_count'] as number) ?? 0,
    frozen: Boolean(r['frozen']),
  };
}
function mapPollVote(r: Record<string, unknown>): PollVote {
  return {
    id: r['id'] as string,
    pollId: r['poll_id'] as string,
    playerId: r['player_id'] as string,
    value: r['value'] as string,
    hidden: Boolean(r['hidden']),
  };
}
function mapBallot(r: Record<string, unknown>): Ballot {
  return {
    id: r['id'] as string,
    roomId: r['room_id'] as string,
    playerId: r['player_id'] as string,
    candidateId: r['candidate_id'] as string,
    hidden: Boolean(r['hidden']),
  };
}

export { ISSUE_BANNERS };
