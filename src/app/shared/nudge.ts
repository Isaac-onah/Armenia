import { Component, computed, inject, input } from '@angular/core';
import { PathService, type Stage } from '../core/path.service';

type Where = 'square' | 'peoples' | 'democrats' | 'media' | 'civic';

@Component({
  selector: 'mq-nudge',
  styles: `
    :host {
      display: inline-flex;
      vertical-align: middle;
    }
    .hand {
      width: 36px;
      height: 26px;
      animation: hand-in 280ms ease both, point 1.1s ease-in-out infinite;
      filter: drop-shadow(0 2px 0 rgba(40, 24, 8, 0.25));
    }
    @keyframes hand-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes point {
      50% { transform: translateX(5px); }
    }
  `,
  template: `
    @if (show()) {
      <svg class="hand" viewBox="0 0 72 48" aria-hidden="true">
        <path
          d="M8 28c0-6 5-10 11-10h16v-6h14l10 10-10 10H35v-4H19c-6 0-11-4-11-10z"
          fill="#f3d2b0"
          stroke="#4a2c0f"
          stroke-width="3"
          stroke-linejoin="round"
        />
        <path d="M14 24h10" stroke="#e0b898" stroke-width="2" stroke-linecap="round" />
      </svg>
    }
  `,
})
export class Nudge {
  readonly where = input.required<Where>();
  private readonly path = inject(PathService);

  readonly show = computed(() => {
    const stage = this.path.stage();
    if (stage === 'done' || this.path.skipped(stage)) return false;
    return matches(this.where(), stage);
  });
}

function matches(where: Where, stage: Stage): boolean {
  if (stage === 'square') return where === 'square';
  if (stage === 'parties') return where === 'peoples' || where === 'democrats';
  if (stage === 'media') return where === 'media';
  if (stage === 'vote') return where === 'civic';
  return false;
}
