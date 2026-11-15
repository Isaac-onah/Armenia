import { Component, input, output } from '@angular/core';
import type { Bubble } from '../core/models';

@Component({
  selector: 'mq-bubble',
  template: `
    <div
      class="relative max-w-[180px] rounded-2xl border-2 px-2 py-1 text-xs shadow"
      [class.bg-white]="!b().frozen"
      [class.bg-stone-300]="b().frozen"
      [class.border-[var(--mq-gold-dark)]]="!b().frozen"
      [class.opacity-60]="b().frozen"
    >
      <p>{{ b().text }}</p>
      <p class="mt-1 text-[10px] uppercase tracking-wide opacity-70">{{ sourceLabel() }}</p>
      @if (!b().frozen) {
        <div class="mt-1 flex gap-1">
          <button class="mq-btn !px-2 !py-0 text-[10px]" type="button" (click)="agree.emit()">
            Agree {{ b().agreeCount }}
          </button>
          <button class="mq-btn mq-btn-ink !px-2 !py-0 text-[10px]" type="button" (click)="report.emit()">
            Report {{ b().reportCount }}
          </button>
        </div>
      }
    </div>
  `,
})
export class SpeechBubble {
  readonly b = input.required<Bubble>();
  readonly agree = output<void>();
  readonly report = output<void>();

  sourceLabel(): string {
    const source = this.b().source;
    if (source === 'seed') return 'neighbour';
    return source;
  }
}
