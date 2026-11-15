import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RoomService } from '../core/room.service';

@Component({
  selector: 'mq-landing',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="mx-auto flex min-h-dvh max-w-lg flex-col justify-center p-4">
      <div class="mq-frame">
        <div class="mq-paper p-6">
          <p class="text-xs uppercase tracking-[0.25em]">Conference island</p>
          <h1 class="mt-1 text-4xl font-bold">My Metropolis</h1>
          <p class="mt-2 text-sm opacity-80">
            Pick a harbour name — never a real name — and set sail. You are the player. There is one path.
          </p>

          <label class="mq-label mt-5">Harbour name</label>
          <input class="mq-field" [(ngModel)]="alias" maxlength="24" placeholder="e.g. Luzzu Fox" />

          <label class="mq-label mt-4">Room code</label>
          <input
            class="mq-field uppercase tracking-[0.3em]"
            [(ngModel)]="code"
            maxlength="4"
            placeholder="DEMO"
          />

          <button class="mq-btn mq-btn-ink mt-5 w-full py-3" type="button" (click)="sail()">
            Set sail
          </button>
          <a routerLink="/host" class="mt-3 block text-center text-sm underline">I'm hosting</a>
          @if (err()) {
            <p class="mt-2 text-sm text-red-800">{{ err() }}</p>
          }
        </div>
      </div>
    </div>
  `,
})
export class Landing {
  private readonly game = inject(RoomService);
  private readonly router = inject(Router);
  alias = '';
  code = 'DEMO';
  err = signal('');

  async sail(): Promise<void> {
    this.err.set('');
    if (!this.alias.trim()) {
      this.err.set('Pick a harbour name first.');
      return;
    }
    const code = await this.game.join(this.code, this.alias, 'wanderer');
    await this.router.navigate(['/map', code]);
  }
}
