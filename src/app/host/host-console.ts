import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ISSUE_BANNERS } from '../core/models';
import { RoomService } from '../core/room.service';
import { QrPlaque } from '../shared/qr';

@Component({
  selector: 'mq-host',
  imports: [RouterLink, QrPlaque],
  template: `
    <div class="mx-auto min-h-dvh max-w-2xl p-4">
      <div class="mq-frame">
        <div class="mq-paper p-6">
          <div class="flex items-center justify-between">
            <h1 class="text-3xl font-bold">Host table</h1>
            <a routerLink="/" class="mq-btn !py-1 text-sm">Dock</a>
          </div>
          <p class="mt-1 text-sm opacity-80">
            Magic-link is for the live Supabase project. Locally, anyone at this desk can run the week
            on mock data.
          </p>

          <label class="mq-label mt-4">Issue banner</label>
          <div class="flex flex-col gap-2">
            @for (b of banners; track b) {
              <button
                type="button"
                class="rounded-xl border-2 px-3 py-2 text-left"
                [class.bg-[var(--mq-cream)]]="banner() === b"
                (click)="banner.set(b); game.setBanner(b)"
              >
                {{ b }}
              </button>
            }
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <button class="mq-btn mq-btn-ink" type="button" (click)="fresh()">New room</button>
            <button class="mq-btn" type="button" (click)="game.startWeek()">Start election week</button>
            <button class="mq-btn" type="button" (click)="game.recap()">TV recap</button>
            <button class="mq-btn" type="button" (click)="game.resetWeek()">Reset week</button>
            <a class="mq-btn" [routerLink]="['/map', game.room().code]">Open island</a>
            <a class="mq-btn" [routerLink]="['/map', game.room().code, 'screen']">Projector</a>
          </div>

          <p class="mt-4 font-bold">
            Code {{ game.room().code }} · {{ game.room().status }} · {{ game.players().length }} on the island
          </p>
          <mq-qr class="mt-3 block" [value]="joinUrl()" />

          <ul class="mt-4 space-y-1 text-sm">
            @for (p of game.players(); track p.id) {
              <li>{{ p.alias }} · {{ p.jersey }} · trust {{ p.trust }}</li>
            }
          </ul>
        </div>
      </div>
    </div>
  `,
})
export class HostConsole {
  readonly game = inject(RoomService);
  private readonly router = inject(Router);
  readonly banners = ISSUE_BANNERS;
  banner = signal<string>(ISSUE_BANNERS[0]);

  joinUrl(): string {
    const origin = typeof location !== 'undefined' ? location.origin : 'http://localhost:4200';
    return `${origin}/map/${this.game.room().code}`;
  }

  async fresh(): Promise<void> {
    const code = await this.game.hostNewRoom(this.banner());
    await this.router.navigate(['/host']);
    void code;
  }
}
