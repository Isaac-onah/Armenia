import { Component, computed, inject, input, output } from '@angular/core';
import { PathService, type Stage } from '../core/path.service';

type Where = 'map' | 'square' | 'peoples' | 'democrats' | 'media' | 'civic';
type Pose = 'welcome' | 'teach' | 'point' | 'success';

interface Beat {
  id: string;
  pose: Pose;
  text: string;
  label: string;
  gate: 'square' | 'parties' | 'media' | 'vote';
  kind: 'see' | 'coach' | 'cheer';
}

@Component({
  selector: 'mq-guide',
  styles: `
    .guide {
      display: flex;
      align-items: flex-end;
      gap: 10px;
      animation: guide-in 460ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .guide.map {
      position: absolute;
      z-index: 6;
      left: 18px;
      bottom: 18px;
      width: min(440px, 42vw);
      pointer-events: none;
    }
    .guide.map .card,
    .guide.map .card button,
    .guide.folded .figure-btn {
      pointer-events: auto;
    }
    .guide.folded .card,
    .guide.folded .card button {
      pointer-events: none;
    }
    .figure-slot {
      position: relative;
      flex: none;
      width: 112px;
      height: 156px;
    }
    .guide.map .figure-slot {
      width: 148px;
      height: 210px;
    }
    .figure-btn {
      position: absolute;
      inset: 0;
      border: 0;
      padding: 0;
      background: none;
      cursor: pointer;
      line-height: 0;
      pointer-events: none;
      transition: transform 140ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .figure-btn:active {
      transform: translateY(3px);
    }
    .figure {
      position: absolute;
      left: 0;
      bottom: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center bottom;
      filter: drop-shadow(0 8px 0 rgba(20, 12, 4, 0.18));
      transition: opacity 280ms ease;
    }
    .pose {
      opacity: 1;
      pointer-events: none;
    }
    .rest {
      opacity: 0;
    }
    .guide.folded .pose {
      opacity: 0;
    }
    .guide.folded .rest {
      opacity: 1;
    }
    @starting-style {
      .pose,
      .card {
        opacity: 0;
      }
    }
    .card-slot {
      display: grid;
      grid-template-columns: 1fr;
      align-items: end;
      min-width: 0;
      flex: 1;
      opacity: 1;
      transform: translateY(0);
      transition:
        grid-template-columns 280ms cubic-bezier(0.22, 1, 0.36, 1),
        max-height 280ms cubic-bezier(0.22, 1, 0.36, 1),
        opacity 240ms ease,
        transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .guide.folded .card-slot {
      grid-template-columns: 0fr;
      opacity: 0;
      transform: translateY(14px);
      pointer-events: none;
    }
    @media (max-width: 768px) {
      .guide.map {
        left: 12px;
        right: 12px;
        bottom: 12px;
        width: auto;
        flex-direction: column-reverse;
        align-items: flex-start;
      }
      .guide.map .figure-slot {
        width: 84px;
        height: 118px;
      }
      .guide.map .card-slot {
        width: min(100%, 280px);
        max-height: 240px;
        overflow: hidden;
      }
      .guide.map.folded .card-slot {
        max-height: 0;
      }
      .card p {
        font-size: 13px;
      }
    }
    .card {
      min-width: 0;
      margin-bottom: 8px;
      overflow: hidden;
      border: 2px solid var(--mq-gold-dark);
      border-radius: 16px;
      background: #fff8e4;
      padding: 10px 12px;
      color: var(--mq-ink);
      box-shadow: 0 8px 0 rgba(20, 12, 4, 0.12);
      opacity: 1;
      transition: opacity 280ms ease;
    }
    .who {
      font-size: 11px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      font-weight: 800;
    }
    .card p {
      margin: 4px 0 0;
      font-size: 14px;
      line-height: 1.35;
    }
    @keyframes guide-in {
      from { opacity: 0; transform: translateY(22px); }
      to { opacity: 1; transform: none; }
    }
  `,
  template: `
    @if (beats().length) {
      <aside class="guide" [class.map]="where() === 'map'" [class.folded]="path.cardClosed()" (pointerdown)="$event.stopPropagation()">
        <div class="figure-slot">
          <button
            class="figure-btn"
            type="button"
            aria-label="Ismael"
            [attr.aria-hidden]="path.cardClosed() ? null : true"
            [attr.tabindex]="path.cardClosed() ? null : -1"
            (click)="open()"
          >
            <img class="figure rest" src="assets/guide/ismael-rest.png" alt="" />
          </button>
          @for (beat of beats(); track beat.id) {
            <img class="figure pose" [src]="src(beat.pose)" alt="" />
          }
        </div>
        @for (beat of beats(); track beat.id) {
          <div class="card-slot" [attr.inert]="path.cardClosed() ? '' : null">
            <div class="card">
              <p class="who">Ismael</p>
              <p>{{ beat.text }}</p>
              <button class="mq-btn mt-2 !py-1 text-sm" type="button" (click)="go(beat)">{{ beat.label }}</button>
            </div>
          </div>
        }
      </aside>
    }
  `,
})
export class Guide {
  readonly where = input.required<Where>();
  readonly gone = output<void>();
  private readonly path = inject(PathService);

  readonly beats = computed(() => {
    const beat = this.beat();
    return beat ? [beat] : [];
  });

  go(beat: Beat): void {
    if (beat.kind === 'see') this.path.see(beat.gate);
    else if (beat.kind === 'coach') this.path.coach(beat.gate);
    else this.path.cheer(beat.gate);
    if (beat.kind === 'cheer') this.path.openCard();
    else this.path.foldCard();
    this.gone.emit();
  }

  open(): void {
    this.path.openCard();
  }

  src(pose: Pose): string {
    return `assets/guide/ismael-${pose}.png`;
  }

  private beat(): Beat | null {
    const where = this.where();
    const flags = this.path.flags();
    const stage = this.path.stage();
    const cheer = this.pendingCheer(where, flags);
    if (cheer) return cheer;
    if (where === 'map') return this.mapIntro(stage);
    return this.placeIntro(where, stage);
  }

  private pendingCheer(where: Where, flags: ReturnType<PathService['flags']>): Beat | null {
    if (where === 'square' && flags.square && !this.path.cheered('square')) {
      return line('square-done', 'success', 'square', 'cheer', 'Onward', 'The yard has had its say. Both party houses are next.');
    }
    if ((where === 'peoples' || where === 'democrats') && flags.peoples && flags.democrats && !this.path.cheered('parties')) {
      return line('parties-done', 'success', 'parties', 'cheer', 'Onward', 'Both houses are heard. The media house tells the same story five ways.');
    }
    if (where === 'media' && flags.media && !this.path.cheered('media')) {
      return line('media-done', 'success', 'media', 'cheer', 'Onward', 'The desk agrees. The civic hall is the vote.');
    }
    if ((where === 'civic' || where === 'map') && flags.civic && !this.path.cheered('vote')) {
      return line('vote-done', 'success', 'vote', 'cheer', 'That is the path', 'You took part. The hall has your vote.');
    }
    return null;
  }

  private mapIntro(stage: Stage): Beat | null {
    if (stage === 'square') {
      return line('square-map', 'welcome', 'square', 'see', "Let's start", "I'm Ismael. You are the player, and there is one path. Start on the playground. Hear someone before you choose a side.");
    }
    if (stage === 'parties') {
      return line('parties-map', 'point', 'parties', 'see', 'Show me', "Both party houses are open. Visit People's and the Democrats, and read what they pledge.");
    }
    if (stage === 'media') {
      return line('media-map', 'point', 'media', 'see', 'Show me', 'The media house is open. See the story five ways, then file the desk note.');
    }
    if (stage === 'vote') {
      return line('vote-map', 'point', 'vote', 'see', 'Show me', 'The hall is open. That is the vote. Walk it in order, then seal one ballot.');
    }
    return null;
  }

  private placeIntro(where: Where, stage: Stage): Beat | null {
    if (where === 'square' && stage === 'square') {
      return line('square-in', 'teach', 'square', 'coach', "I'm ready", 'Stop a walker. The dots come up, then their words. Agree or report. That is your first say.');
    }
    if ((where === 'peoples' || where === 'democrats') && stage === 'parties') {
      return line('parties-in', 'teach', 'parties', 'coach', "I'm ready", 'Read this house. The contender, the pledges, the seats. Then visit the other one.');
    }
    if (where === 'media' && stage === 'media') {
      return line('media-in', 'teach', 'media', 'coach', "I'm ready", 'Open live TV, X, TikTok, Instagram, and the Harbour Ledger. Then file the desk note.');
    }
    if (where === 'civic' && stage === 'vote') {
      return line('vote-in', 'teach', 'vote', 'coach', "I'm ready", 'Wall, meeting, roll, hearing, ballot. Take part in each one before the card will stamp.');
    }
    return null;
  }
}

function line(
  id: string,
  pose: Pose,
  gate: Beat['gate'],
  kind: Beat['kind'],
  label: string,
  text: string,
): Beat {
  return { id, pose, gate, kind, label, text };
}
