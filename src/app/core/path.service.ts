import { Injectable, computed, effect, inject, signal } from '@angular/core';
import type { PlaceSlug } from './models';
import { RoomService } from './room.service';

export type Stage = 'square' | 'parties' | 'media' | 'vote' | 'done';
type Gate = 'square' | 'parties' | 'media' | 'vote';
type PlayPlace = Exclude<PlaceSlug, 'tv' | 'screen'>;

interface Flags {
  square: boolean;
  peoples: boolean;
  democrats: boolean;
  media: boolean;
  civic: boolean;
}

interface PathState extends Flags {
  seen: Record<Gate, boolean>;
  coached: Record<Gate, boolean>;
  cheered: Record<Gate, boolean>;
  skipped: Record<Gate, boolean>;
}

const KEY = 'mq-path-v1';

const EMPTY: PathState = {
  square: false,
  peoples: false,
  democrats: false,
  media: false,
  civic: false,
  seen: { square: false, parties: false, media: false, vote: false },
  coached: { square: false, parties: false, media: false, vote: false },
  cheered: { square: false, parties: false, media: false, vote: false },
  skipped: { square: false, parties: false, media: false, vote: false },
};

@Injectable({ providedIn: 'root' })
export class PathService {
  private readonly state = signal<PathState>(load());
  private readonly game = inject(RoomService);
  /** The speech card is closed, and Ismael stays with his arms folded. */
  readonly cardClosed = signal(false);

  readonly stage = computed<Stage>(() => {
    const s = this.state();
    if (!s.square) return 'square';
    if (!s.peoples || !s.democrats) return 'parties';
    if (!s.media) return 'media';
    if (!s.civic) return 'vote';
    return 'done';
  });

  private readonly reopenCard = effect(() => {
    this.stage();
    this.cardClosed.set(false);
  });

  readonly score = computed(() => {
    const s = this.state();
    return (s.square ? 20 : 0) + (s.peoples ? 15 : 0) + (s.democrats ? 15 : 0) + (s.media ? 25 : 0) + (s.civic ? 25 : 0);
  });

  readonly marks = computed(() => {
    const s = this.state();
    return [
      { label: 'Heard the playground', points: 20, done: s.square },
      { label: "Read People's house", points: 15, done: s.peoples },
      { label: 'Read the Democrats', points: 15, done: s.democrats },
      { label: 'Filed the media desk', points: 25, done: s.media },
      { label: 'Sealed the vote', points: 25, done: s.civic },
    ];
  });

  readonly hint = computed(() => {
    switch (this.stage()) {
      case 'square':
        return 'Stop a walker on the playground. Let them speak, then agree or report.';
      case 'parties':
        return 'Both party houses are open. Read the contender and the pledges in each one.';
      case 'media':
        return 'Open live TV, X, TikTok, Instagram, and the Harbour Ledger. Then file what they share.';
      case 'vote':
        return 'The hall is the vote. Walk the wall, the meeting, the roll, the hearing, and the ballot.';
      default:
        return 'The path is complete. The hall has your vote.';
    }
  });

  placeOpen(place: PlayPlace): boolean {
    const s = this.state();
    if (place === 'square') return true;
    if (place === 'peoples' || place === 'democrats') return s.square;
    if (place === 'media') return s.peoples && s.democrats;
    return s.media;
  }

  isNext(place: PlayPlace): boolean {
    return this.nextPlaces().includes(place);
  }

  nextPlaces(): PlayPlace[] {
    const s = this.state();
    if (!s.square) return ['square'];
    if (!s.peoples || !s.democrats) {
      const open: PlayPlace[] = [];
      if (!s.peoples) open.push('peoples');
      if (!s.democrats) open.push('democrats');
      return open;
    }
    if (!s.media) return ['media'];
    if (!s.civic) return ['civic'];
    return [];
  }

  focusPlace(): PlayPlace | null {
    return this.nextPlaces()[0] ?? null;
  }

  seen(gate: Gate): boolean {
    return this.state().seen[gate];
  }

  coached(gate: Gate): boolean {
    return this.state().coached[gate];
  }

  cheered(gate: Gate): boolean {
    return this.state().cheered[gate];
  }

  skipped(stage: Stage): boolean {
    if (stage === 'done') return false;
    return this.state().skipped[stage];
  }

  skipStage(): void {
    const stage = this.stage();
    if (stage === 'done') return;
    const skipped = { ...this.state().skipped, [stage]: true };
    const seen = { ...this.state().seen, [stage]: true };
    const coached = { ...this.state().coached, [stage]: true };
    this.patch({ skipped, seen, coached });
  }

  foldCard(): void {
    this.cardClosed.set(true);
  }

  openCard(): void {
    this.cardClosed.set(false);
  }

  flags(): Flags {
    const s = this.state();
    return {
      square: s.square,
      peoples: s.peoples,
      democrats: s.democrats,
      media: s.media,
      civic: s.civic,
    };
  }

  markSquare(): void {
    if (this.state().square) return;
    this.patch({ square: true });
    this.game.grantTrust(2);
  }

  markParty(slug: 'peoples' | 'democrats'): void {
    if (this.state()[slug]) return;
    this.patch({ [slug]: true });
    this.game.grantTrust(1);
  }

  markMedia(): void {
    if (this.state().media) return;
    this.patch({ media: true });
    this.game.grantTrust(3);
  }

  markCivic(): void {
    if (this.state().civic) return;
    this.patch({ civic: true });
    this.game.grantTrust(4);
  }

  see(gate: Gate): void {
    const seen = { ...this.state().seen, [gate]: true };
    this.patch({ seen });
  }

  coach(gate: Gate): void {
    const coached = { ...this.state().coached, [gate]: true };
    this.patch({ coached });
  }

  cheer(gate: Gate): void {
    const cheered = { ...this.state().cheered, [gate]: true };
    this.patch({ cheered });
  }

  private patch(partial: Partial<PathState>): void {
    const next = { ...this.state(), ...partial };
    this.state.set(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }
}

function load(): PathState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const saved = JSON.parse(raw) as Partial<PathState>;
    return {
      ...EMPTY,
      ...saved,
      seen: { ...EMPTY.seen, ...saved.seen },
      coached: { ...EMPTY.coached, ...saved.coached },
      cheered: { ...EMPTY.cheered, ...saved.cheered },
      skipped: { ...EMPTY.skipped, ...saved.skipped },
    };
  } catch {
    return EMPTY;
  }
}
