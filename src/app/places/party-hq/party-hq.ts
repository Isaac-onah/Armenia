import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import type { PartySlug } from '../../core/models';
import { PathService } from '../../core/path.service';
import { Guide } from '../../shared/guide';
import { Nudge } from '../../shared/nudge';
import { HOUSE_SEATS, partyOffice } from './party-office';

@Component({
  selector: 'mq-party-hq',
  imports: [Guide, Nudge],
  styles: `
    .card {
      border: 2px solid var(--mq-gold-dark);
      border-radius: 16px;
      background: #fff8e4;
      padding: 10px;
    }
    .contender {
      display: flex;
      gap: 12px;
      align-items: flex-end;
    }
    .portrait {
      width: 128px;
      height: 160px;
      flex: none;
      object-fit: contain;
      object-position: center bottom;
      border-radius: 12px;
      background:
        radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.7), transparent 60%),
        var(--mq-cream);
    }
    .eyebrow {
      font-size: 0.7rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }
    .track {
      display: flex;
      height: 16px;
      overflow: hidden;
      border: 2px solid #4a2c0f;
      border-radius: 999px;
      background: #efe0b8;
    }
    .track i {
      display: block;
      height: 100%;
    }
    .track .people { background: var(--mq-people); }
    .track .democrats { background: var(--mq-democrats); }
    .track .others { background: #c4b496; }
    li + li { margin-top: 4px; }
    .manifesto {
      display: flex;
      gap: 12px;
      align-items: flex-end;
    }
    .hail {
      width: 148px;
      height: 188px;
    }
    .caret {
      display: inline-block;
      width: 2px;
      height: 1em;
      margin-left: 1px;
      background: #4a2c0f;
      vertical-align: text-bottom;
      animation: blink 0.8s steps(1) infinite;
    }
    @keyframes blink {
      0%, 60%, 100% { opacity: 0.2; }
      30% { opacity: 1; }
    }
  `,
  template: `
    <div class="space-y-3">
      <mq-guide [where]="slug()" />
      <div class="flex items-center gap-3">
        <img [src]="office().building" alt="" class="h-20 w-auto shrink-0" />
        <div>
          <p class="text-xs uppercase tracking-widest">{{ office().pin }}</p>
          <h2 class="text-2xl font-bold" [style.color]="color()">{{ office().title }}</h2>
        </div>
      </div>

      <section class="card contender" [style.borderColor]="color()">
        <img class="portrait" [src]="office().portrait" alt="" />
        <div class="min-w-0">
          <p class="eyebrow" [style.color]="color()">Proposed contender</p>
          <h3 class="text-xl font-bold leading-tight">{{ office().contender }}</h3>
          <p class="mt-1 text-sm">Standing for the House of Representatives.</p>
          <p class="mt-2 text-sm font-bold">{{ office().pitch }}</p>
        </div>
      </section>

      <section class="card manifesto" [style.borderColor]="color()">
        <img class="portrait hail" [src]="office().hail" alt="" />
        <div class="min-w-0 flex-1">
          <h3 class="font-bold"><mq-nudge [where]="slug()" /> Manifesto</h3>
          <ol class="mt-2 list-decimal space-y-1 pl-5 text-sm">
            @for (line of typedLines(); track $index) {
              @if (line.length || speaking() === $index) {
                <li>
                  {{ line }}
                  @if (speaking() === $index) {
                    <span class="caret"></span>
                  }
                </li>
              }
            }
          </ol>
        </div>
      </section>

      <section class="card">
        <h3 class="font-bold">House of Representatives</h3>
        <p class="mt-1 text-lg font-bold" [style.color]="color()">
          {{ office().seats }} of {{ house }} seats · {{ office().percent }}%
        </p>
        <div class="track mt-2" aria-hidden="true">
          <i class="people" style="width: 45%"></i>
          <i class="democrats" style="width: 42%"></i>
          <i class="others" style="width: 13%"></i>
        </div>
        <p class="mt-2 text-xs">
          <span [class.font-bold]="slug() === 'peoples'">People's 29</span>
          ·
          <span [class.font-bold]="slug() === 'democrats'">Democrats 27</span>
          · Others 9
        </p>
      </section>

      <section class="card">
        <h3 class="font-bold">Posts held</h3>
        <ul class="mt-2 list-disc pl-5 text-sm">
          @for (post of office().posts; track post) {
            <li>{{ post }}</li>
          }
        </ul>
      </section>

      <section class="card">
        <h3 class="font-bold">History of the party</h3>
        <p class="mt-2 text-sm">{{ office().history }}</p>
      </section>
    </div>
  `,
})
export class PartyHq implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly path = inject(PathService);
  readonly slug = signal<PartySlug>('peoples');
  readonly house = HOUSE_SEATS;
  readonly office = computed(() => partyOffice(this.slug()));
  readonly color = computed(() => (this.slug() === 'peoples' ? 'var(--mq-people)' : 'var(--mq-democrats)'));
  readonly typedLines = signal<string[]>([]);
  readonly speaking = signal(-1);
  private typeTimer: number | null = null;

  constructor() {
    this.route.data.subscribe((d) => {
      const slug = (d['slug'] as PartySlug) ?? 'peoples';
      this.slug.set(slug);
      this.path.markParty(slug);
      this.startSpeech();
    });
  }

  ngOnDestroy(): void {
    this.stopSpeech();
  }

  private startSpeech(): void {
    this.stopSpeech();
    const pledges = this.office().pledges;
    const lines = pledges.map(() => '');
    this.typedLines.set(lines);
    this.speaking.set(0);
    let index = 0;
    let count = 0;
    this.typeTimer = window.setInterval(() => {
      if (index >= pledges.length) {
        this.stopSpeech();
        this.speaking.set(-1);
        return;
      }
      count += 1;
      lines[index] = pledges[index].slice(0, count);
      this.typedLines.set([...lines]);
      if (count >= pledges[index].length) {
        index += 1;
        count = 0;
        this.speaking.set(index >= pledges.length ? -1 : index);
        if (index >= pledges.length) this.stopSpeech();
      }
    }, 26);
  }

  private stopSpeech(): void {
    if (this.typeTimer !== null) {
      window.clearInterval(this.typeTimer);
      this.typeTimer = null;
    }
  }
}
