import { Injectable, computed, signal } from '@angular/core';
import { getSupabase, supabaseConfigured } from './supabase';
import { newId, type Jersey, type Player } from './models';

const STORAGE_KEY = 'malta-quest-session';

interface Session {
  userId: string;
  alias: string;
  jersey: Jersey;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly session = signal<Session | null>(readSession());

  readonly userId = computed(() => this.session()?.userId ?? null);
  readonly alias = computed(() => this.session()?.alias ?? '');
  readonly jersey = computed(() => this.session()?.jersey ?? 'wanderer');
  readonly live = supabaseConfigured();

  async ensureUser(): Promise<string> {
    const existing = this.session();
    if (existing) {
      if (this.live) {
        const sb = getSupabase();
        if (sb) {
          const { data } = await sb.auth.getSession();
          if (!data.session) {
            await sb.auth.signInAnonymously();
          }
        }
      }
      return existing.userId;
    }
    let userId = newId();
    if (this.live) {
      const sb = getSupabase();
      if (sb) {
        const { data, error } = await sb.auth.signInAnonymously();
        if (!error && data.user) {
          userId = data.user.id;
        }
      }
    }
    const next: Session = { userId, alias: '', jersey: 'wanderer' };
    this.session.set(next);
    writeSession(next);
    return userId;
  }

  remember(alias: string, jersey: Jersey): void {
    const current = this.session();
    const next: Session = {
      userId: current?.userId ?? newId(),
      alias: alias.trim() || 'Harbour name',
      jersey,
    };
    this.session.set(next);
    writeSession(next);
  }

  asPlayer(roomId: string, playerId?: string): Player {
    const s = this.session();
    return {
      id: playerId ?? newId(),
      roomId,
      userId: s?.userId ?? newId(),
      alias: s?.alias || 'Harbour name',
      jersey: s?.jersey ?? 'wanderer',
      trust: 0,
    };
  }
}

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function writeSession(session: Session): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* ignore quota */
  }
}
