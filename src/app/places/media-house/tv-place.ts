import { Component, inject, signal } from '@angular/core';
import { RoomService } from '../../core/room.service';
import { TvFrame } from '../../shared/tv-frame';

@Component({
  selector: 'mq-tv-place',
  imports: [TvFrame],
  template: `
    <div class="space-y-3">
      <p class="text-xs uppercase tracking-widest">MQ-TV</p>
      <h2 class="text-2xl font-bold">Island bulletin</h2>
      <p class="text-sm opacity-80">Only stories the desk stamped Run. Killed copy never airs.</p>
      <mq-tv [stories]="game.approved()" [tick]="tick()" />
      @if (game.room().status === 'recap' && game.result(); as recap) {
        <section class="rounded-xl border-2 border-[var(--mq-gold-dark)] bg-[#fff8e4] p-3">
          <h3 class="font-bold">Week recap</h3>
          <p>Winner: {{ winnerName(recap.winnerCandidateId) }}</p>
          <p>Informed island trophy: {{ recap.informedIsland ? 'yes' : 'not this week' }}</p>
          <p class="text-sm opacity-70">Killed: {{ killed() }} · rumours walking: {{ rumours() }}</p>
        </section>
      }
    </div>
  `,
})
export class TvPlace {
  readonly game = inject(RoomService);
  readonly tick = signal(0);

  constructor() {
    setInterval(() => this.tick.update((n) => n + 1), 1000);
  }

  winnerName(id: string | null): string {
    if (!id) return 'Nobody filed — empty paper.';
    return this.game.candidates().find((c) => c.id === id)?.name ?? 'Unknown';
  }

  killed(): number {
    return this.game.stories().filter((s) => s.status === 'killed').length;
  }

  rumours(): number {
    return this.game.bubbles().filter((b) => b.source === 'rumour' && !b.frozen).length;
  }
}
