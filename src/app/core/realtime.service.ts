import { Injectable, OnDestroy } from '@angular/core';
import { getSupabase, supabaseConfigured } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class RealtimeService implements OnDestroy {
  private channel: RealtimeChannel | null = null;

  subscribe(roomId: string, onChange: () => void): void {
    this.unsubscribe();
    if (!supabaseConfigured()) return;
    const sb = getSupabase();
    if (!sb) return;
    this.channel = sb
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stories', filter: `room_id=eq.${roomId}` },
        () => onChange(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'parties', filter: `room_id=eq.${roomId}` },
        () => onChange(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'candidates', filter: `room_id=eq.${roomId}` },
        () => onChange(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bubbles', filter: `room_id=eq.${roomId}` },
        () => onChange(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'polls', filter: `room_id=eq.${roomId}` },
        () => onChange(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        () => onChange(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` },
        () => onChange(),
      )
      .subscribe();
  }

  unsubscribe(): void {
    const sb = getSupabase();
    if (this.channel && sb) {
      void sb.removeChannel(this.channel);
    }
    this.channel = null;
  }

  ngOnDestroy(): void {
    this.unsubscribe();
  }
}
