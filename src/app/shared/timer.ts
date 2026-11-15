import { Component, computed, inject, output, signal } from '@angular/core';
import { RoomService } from '../core/room.service';

@Component({
  selector: 'mq-timer',
  template: `
    <button class="mq-chip tabular-nums" type="button" (click)="open.emit()">
      @if (room.room().status === 'live') {
        Week {{ label() }}
      } @else if (room.room().status === 'recap') {
        Recap
      } @else {
        Lobby
      }
    </button>
  `,
})
export class Timer {
  readonly room = inject(RoomService);
  readonly open = output<void>();
  private readonly tick = signal(Date.now());
  readonly label = computed(() => {
    this.tick();
    if (this.room.room().status !== 'live') return '--:--';
    const ms = this.room.remainingMs();
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  });

  constructor() {
    setInterval(() => this.tick.set(Date.now()), 1000);
  }
}
