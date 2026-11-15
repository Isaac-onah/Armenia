import { Component, OnDestroy, inject, signal } from '@angular/core';
import type { Bubble, ReportReason } from '../../core/models';
import { PathService } from '../../core/path.service';
import { RoomService } from '../../core/room.service';
import { Guide } from '../../shared/guide';
import { Nudge } from '../../shared/nudge';

@Component({
  selector: 'mq-square',
  imports: [Guide, Nudge],
  styles: `
    .yard mq-nudge {
      position: absolute;
      z-index: 4;
      top: 8px;
      left: 8px;
    }
    .yard {
      position: relative;
      height: 340px;
      overflow: hidden;
      border-radius: 16px;
      background:
        radial-gradient(circle at 70% 80%, #c4d98a 0%, transparent 36%),
        radial-gradient(circle at 20% 30%, #9ec56a 0%, transparent 42%),
        linear-gradient(#7eae58, #5a8a4a);
      border: 3px solid #4a2c0f;
    }
    .scenery {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    .person {
      width: 36px;
      height: 52px;
      cursor: pointer;
    }
    .person.stopped {
      animation-play-state: paused;
      z-index: 5;
    }
    .person.stopped .leg,
    .person.stopped .arm {
      animation-play-state: paused;
    }
    .figure {
      display: block;
      width: 36px;
      height: 52px;
      filter: drop-shadow(0 2px 0 rgba(40, 24, 8, 0.28));
    }
    .leg,
    .arm {
      transform-box: fill-box;
      transform-origin: center top;
      animation: step 0.38s ease-in-out infinite alternate;
    }
    .leg.far,
    .arm.near {
      animation-delay: -0.38s;
    }
    .dots {
      position: absolute;
      z-index: 6;
      display: flex;
      gap: 4px;
      padding: 6px 8px;
      background: var(--mq-cream);
      border: 2px solid var(--mq-gold-dark);
      border-radius: 999px;
    }
    .dots.above { left: 50%; bottom: calc(100% + 6px); transform: translateX(-50%); }
    .dots.below { left: 50%; top: calc(100% + 6px); transform: translateX(-50%); }
    .dots i {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #4a2c0f;
      animation: blink 1s infinite;
    }
    .dots i:nth-child(2) { animation-delay: 0.15s; }
    .dots i:nth-child(3) { animation-delay: 0.3s; }
    .dots i:nth-child(4) { animation-delay: 0.45s; }
    .talk {
      position: absolute;
      z-index: 7;
      left: 8px;
      right: 8px;
      bottom: 8px;
      display: flex;
      gap: 10px;
      align-items: flex-end;
      padding: 8px;
      border: 2px solid var(--mq-gold-dark);
      border-radius: 16px;
      background: #fff8e4;
    }
    .talk.top {
      top: 8px;
      bottom: auto;
    }
    .talk img {
      width: 92px;
      height: 118px;
      flex: none;
      object-fit: contain;
      object-position: center bottom;
      border-radius: 12px;
    }
    .talk p {
      min-height: 3.2em;
      font-size: 0.95rem;
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
    @keyframes step {
      from { transform: rotate(-24deg); }
      to { transform: rotate(24deg); }
    }
    @keyframes blink {
      0%, 60%, 100% { opacity: 0.25; }
      30% { opacity: 1; }
    }
  `,
  template: `
    <div class="space-y-3">
      <mq-guide where="square" />
      <div class="flex items-center gap-3">
        <img src="assets/places/playground.png" alt="" class="h-16 w-auto shrink-0" />
        <div>
          <p class="text-xs uppercase tracking-widest">Pin 5</p>
          <h2 class="text-2xl font-bold">Playground</h2>
        </div>
      </div>
      <p class="text-sm opacity-80">People walk. Tap someone to hear how they feel about the parties, and whether they trust the media.</p>

      <div class="yard">
        <mq-nudge where="square" />
        <svg class="scenery" viewBox="0 0 400 340" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <path d="M30 250 C 110 210, 180 270, 250 220 C 310 180, 340 210, 390 170" fill="none" stroke="#d7b57a" stroke-width="22" stroke-linecap="round" opacity="0.7" />
          <g stroke="#4a2c0f" stroke-width="2" stroke-linejoin="round">
            <g transform="translate(24 24)">
              <rect x="10" y="28" width="6" height="22" fill="#8b5a12" />
              <circle cx="13" cy="20" r="16" fill="#5a8a4a" />
              <circle cx="6" cy="24" r="10" fill="#7eae58" />
            </g>
            <g transform="translate(330 28)">
              <rect x="12" y="30" width="6" height="24" fill="#8b5a12" />
              <circle cx="15" cy="20" r="17" fill="#3f6b38" />
              <circle cx="22" cy="26" r="10" fill="#6e9a52" />
            </g>
            <g transform="translate(16 240)">
              <rect x="14" y="34" width="6" height="24" fill="#8b5a12" />
              <circle cx="17" cy="22" r="18" fill="#4f7d40" />
            </g>
          </g>
          <g transform="translate(48 78)" stroke="#4a2c0f" stroke-width="2" stroke-linejoin="round">
            <rect x="10" y="6" width="8" height="96" fill="#c9854a" />
            <rect x="62" y="36" width="8" height="66" fill="#c9854a" />
            <path d="M6 8 h70 v14 H6z" fill="#e23b3b" />
            <path d="M8 4 h22" stroke="#f0a020" stroke-width="5" />
            <path d="M34 4 h20" stroke="#3aa0d0" stroke-width="5" />
            <path d="M58 4 h16" stroke="#5a8a4a" stroke-width="5" />
            <rect x="22" y="40" width="28" height="16" fill="#e8c98a" />
            <path d="M66 42 C 104 58, 112 92, 98 124 L 80 116 C 90 90, 84 66, 58 54z" fill="#f0c014" />
          </g>
          <g transform="translate(230 86)" stroke="#4a2c0f" stroke-width="2.4" stroke-linecap="round">
            <path d="M16 6 v100 M104 6 v100 M16 6 h88" fill="none" />
            <path d="M44 14 v46 M78 14 v46" fill="none" stroke-width="1.8" />
            <rect x="32" y="58" width="24" height="8" rx="3" fill="#c45c3e" stroke-width="1.6" />
            <rect x="66" y="58" width="24" height="8" rx="3" fill="#2f6f8f" stroke-width="1.6" />
          </g>
          <g transform="translate(145 230)" stroke="#4a2c0f" stroke-width="2" stroke-linejoin="round">
            <rect width="100" height="58" rx="6" fill="#e7c98a" />
            <rect x="8" y="8" width="84" height="42" rx="4" fill="#f3ddb0" />
            <rect x="62" y="16" width="14" height="12" rx="2" fill="#c45c3e" />
            <circle cx="36" cy="30" r="4" fill="#8b5a12" />
          </g>
          <g stroke="#4a2c0f" stroke-width="1.6" stroke-linejoin="round">
            <g transform="translate(168 168)">
              <path d="M4 14 h36 l-4 10 H8z" fill="#c9854a" />
              <path d="M10 14 V4 M32 14 V4" />
            </g>
            <g transform="translate(300 188)">
              <path d="M4 14 h36 l-4 10 H8z" fill="#8b5a12" />
              <path d="M10 14 V4 M32 14 V4" />
            </g>
          </g>
          <g fill="#e23b3b" stroke="#4a2c0f" stroke-width="1.2">
            <circle cx="200" cy="150" r="4" />
            <circle cx="210" cy="158" r="3" />
            <circle cx="120" cy="200" r="3.5" />
            <circle cx="360" cy="160" r="3.5" />
          </g>
        </svg>
        @for (w of walkers; track w.i) {
          <div
            class="person walker"
            [class.stopped]="stopped() === w.i"
            [style.--dur]="w.dur"
            [style.--delay]="w.delay"
            [style.offset-path]="w.path"
            (click)="toggle(w.i, $event)"
          >
            <svg class="figure" viewBox="0 0 36 52" aria-hidden="true">
              <ellipse cx="18" cy="49" rx="8" ry="2.2" fill="rgba(40,24,8,0.28)" />
              <g class="leg far">
                <path d="M13 33 h4.5 v13 h-4.5z" fill="#3d2a1c" stroke="#4a2c0f" stroke-width="1.4" stroke-linejoin="round" />
                <path d="M11 45 h8 v3.2 h-8z" fill="#2a1808" stroke="#4a2c0f" stroke-width="1.2" />
              </g>
              <g class="leg near">
                <path d="M18.5 33 h4.5 v13 h-4.5z" fill="#3d2a1c" stroke="#4a2c0f" stroke-width="1.4" stroke-linejoin="round" />
                <path d="M16.5 45 h8 v3.2 h-8z" fill="#2a1808" stroke="#4a2c0f" stroke-width="1.2" />
              </g>
              <path d="M9 20 h18 l-1.5 15 h-15z" [attr.fill]="w.color" stroke="#4a2c0f" stroke-width="1.6" stroke-linejoin="round" />
              <g class="arm far">
                <path d="M10 22 L5 33" fill="none" stroke="#4a2c0f" stroke-width="2.1" stroke-linecap="round" />
                <circle cx="5" cy="34" r="2.1" fill="#f3d2b0" stroke="#4a2c0f" stroke-width="1.2" />
              </g>
              <g class="arm near">
                <path d="M26 22 L31 33" fill="none" stroke="#4a2c0f" stroke-width="2.1" stroke-linecap="round" />
                <circle cx="31" cy="34" r="2.1" fill="#f3d2b0" stroke="#4a2c0f" stroke-width="1.2" />
              </g>
              <circle cx="18" cy="12" r="8" fill="#f3d2b0" stroke="#4a2c0f" stroke-width="1.6" />
              @switch (w.look) {
                @case (0) {
                  <path d="M10 13 Q18 2 26 13 Q23 8 18 7 Q13 8 10 13Z" fill="#4a2c0f" />
                }
                @case (1) {
                  <path d="M11 11 Q18 3 25 11 L26 16 Q18 12 10 16Z" fill="#2a1808" />
                }
                @case (2) {
                  <path d="M9 12 h18 v5 h-18z" fill="#c9a227" stroke="#4a2c0f" stroke-width="1.2" />
                  <path d="M8 16 h20" fill="none" stroke="#4a2c0f" stroke-width="1.3" />
                }
                @case (3) {
                  <path d="M11 12 Q18 5 25 12" fill="none" stroke="#4a2c0f" stroke-width="2.2" stroke-linecap="round" />
                }
              }
              <circle cx="15" cy="13" r="0.9" fill="#4a2c0f" />
              <circle cx="21" cy="13" r="0.9" fill="#4a2c0f" />
              <path d="M16 16.5 Q18 18 20 16.5" fill="none" stroke="#c48a72" stroke-width="0.8" stroke-linecap="round" />
            </svg>
            @if (stopped() === w.i) {
              <div class="dots" [class.above]="!bubbleBelow()" [class.below]="bubbleBelow()">
                <i></i><i></i><i></i><i></i>
              </div>
            }
          </div>
        }
        @if (currentOpinion(); as thought) {
          <div class="talk" [class.top]="talkTop()" (click)="$event.stopPropagation()">
            <img [src]="portrait(stopped() ?? 0)" alt="" />
            <div class="min-w-0 flex-1">
              <p>
                {{ typed() }}
                @if (!showActions()) {
                  <span class="caret"></span>
                }
              </p>
              @if (showActions() && !thought.frozen) {
                <div class="mt-2 flex gap-2">
                  <button class="mq-btn !py-1 text-sm" type="button" (click)="agree(thought.id)">
                    Agree {{ thought.agreeCount }}
                  </button>
                  <button class="mq-btn mq-btn-ink !py-1 text-sm" type="button" (click)="openReport.set(thought.id)">
                    Report {{ thought.reportCount }}
                  </button>
                </div>
              }
            </div>
          </div>
        }
      </div>

      @if (openReport()) {
        <div class="rounded-xl border-2 border-[var(--mq-gold-dark)] bg-[#fff8e4] p-3">
          <p class="font-bold">Why report this bubble?</p>
          <div class="mt-2 flex flex-wrap gap-2">
            @for (r of reasons; track r) {
              <button class="mq-btn !py-1 text-sm" type="button" (click)="report(r)">{{ r }}</button>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class Square implements OnDestroy {
  readonly game = inject(RoomService);
  private readonly path = inject(PathService);
  openReport = signal<string | null>(null);
  readonly stopped = signal<number | null>(null);
  readonly bubbleBelow = signal(false);
  readonly talkTop = signal(false);
  readonly typed = signal('');
  readonly showActions = signal(false);
  private typeTimer: number | null = null;
  readonly reasons: ReportReason[] = ['harassment', 'deepfake', 'privacy', 'unverified', 'smear'];
  readonly portraits = [
    'assets/people/p1.png?v=3',
    'assets/people/p2.png?v=3',
    'assets/people/p3.png?v=3',
    'assets/people/p4.png?v=3',
    'assets/people/p5.png?v=3',
    'assets/people/p6.png?v=3',
  ];
  readonly walkers = [
    { i: 0, look: 0, dur: '18s', delay: '0s', color: '#c45c3e', path: "path('M 28 270 L 360 255 L 348 190 L 36 205 Z')" },
    { i: 1, look: 1, dur: '16s', delay: '-4s', color: '#2f6f8f', path: "path('M 40 70 L 370 88 L 350 150 L 32 132 Z')" },
    { i: 2, look: 2, dur: '20s', delay: '-7s', color: '#c9a227', path: "path('M 60 150 L 170 210 L 300 250 L 360 160 L 240 96 L 70 100 Z')" },
    { i: 3, look: 3, dur: '22s', delay: '-2s', color: '#4a2c0f', path: "path('M 300 56 L 370 180 L 300 292 L 48 276 L 36 140 L 180 64 Z')" },
    { i: 4, look: 1, dur: '17s', delay: '-9s', color: '#c45c3e', path: "path('M 48 230 L 220 248 L 380 220 L 200 168 L 48 230')" },
    { i: 5, look: 0, dur: '19s', delay: '-5s', color: '#2f6f8f', path: "path('M 80 48 L 250 70 L 340 140 L 220 200 L 70 160 L 80 48')" },
    { i: 6, look: 3, dur: '21s', delay: '-11s', color: '#5a8a4a', path: "path('M 140 290 L 40 200 L 120 90 L 280 80 L 360 190 L 250 280 Z')" },
    { i: 7, look: 2, dur: '15s', delay: '-1s', color: '#8b5a12', path: "path('M 24 120 L 200 100 L 380 130 L 360 240 L 160 260 L 30 200 Z')" },
  ];

  opinion(i: number): Bubble | null {
    const list = this.game.bubbles().filter((b) => b.source === 'seed');
    if (!list.length) return null;
    return list[i % list.length];
  }

  currentOpinion(): Bubble | null {
    const who = this.stopped();
    if (who === null) return null;
    return this.opinion(who);
  }

  portrait(i: number): string {
    return this.portraits[i % this.portraits.length];
  }

  toggle(i: number, ev: MouseEvent): void {
    if (this.stopped() === i) {
      this.stopTalk();
      this.stopped.set(null);
      return;
    }
    const person = ev.currentTarget as HTMLElement;
    const yard = person.closest('.yard') as HTMLElement;
    const personBox = person.getBoundingClientRect();
    const yardBox = yard.getBoundingClientRect();
    const fromTop = personBox.top - yardBox.top;
    const fromBottom = yardBox.bottom - personBox.bottom;
    const cardOnTop = fromTop + personBox.height / 2 > yardBox.height / 2;
    this.talkTop.set(cardOnTop);
    this.bubbleBelow.set(cardOnTop ? fromBottom > 28 : fromTop < 36);
    this.stopped.set(i);
    this.startTalk(i);
  }

  ngOnDestroy(): void {
    this.stopTalk();
  }

  private startTalk(i: number): void {
    this.stopTalk();
    const thought = this.opinion(i);
    const text = thought?.text ?? '';
    this.typed.set('');
    this.showActions.set(false);
    let n = 0;
    this.typeTimer = window.setInterval(() => {
      n += 1;
      this.typed.set(text.slice(0, n));
      if (n >= text.length) {
        this.stopTalk();
        this.showActions.set(true);
      }
    }, 26);
  }

  private stopTalk(): void {
    if (this.typeTimer !== null) {
      window.clearInterval(this.typeTimer);
      this.typeTimer = null;
    }
  }

  agree(id: string): void {
    this.game.reactBubble(id, 'agree');
    this.path.markSquare();
  }

  report(reason: ReportReason): void {
    const id = this.openReport();
    if (!id) return;
    this.game.reactBubble(id, 'report', reason);
    this.path.markSquare();
    this.openReport.set(null);
  }
}
