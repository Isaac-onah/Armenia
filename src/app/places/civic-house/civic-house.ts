import { Component, computed, inject, signal } from '@angular/core';
import { PathService } from '../../core/path.service';
import { RoomService } from '../../core/room.service';
import { Guide } from '../../shared/guide';
import { Nudge } from '../../shared/nudge';
import { partyOffice, type PartyOffice } from '../party-hq/party-office';

type Step = 'wall' | 'meeting' | 'roll' | 'hearing' | 'ballot';

const STEPS: { id: Step; name: string; hint: string }[] = [
  { id: 'wall', name: 'The wall', hint: 'Both pledges' },
  { id: 'meeting', name: 'The meeting', hint: 'One pebble' },
  { id: 'roll', name: 'The roll', hint: 'Your harbour name' },
  { id: 'hearing', name: 'The hearing', hint: 'Both contenders' },
  { id: 'ballot', name: 'The ballot', hint: 'One sealed vote' },
];

@Component({
  selector: 'mq-civic-house',
  imports: [Guide, Nudge],
  styles: `
    .step {
      display: flex;
      width: 100%;
      align-items: center;
      gap: 10px;
      text-align: left;
      border: 2px solid var(--mq-gold-dark);
      border-radius: 14px;
      background: #fff8e4;
      padding: 8px 10px;
      cursor: pointer;
    }
    .step:disabled { opacity: 0.55; cursor: default; }
    .step.done { box-shadow: inset 3px 0 0 #3f6b38; }
    .num {
      width: 28px;
      height: 28px;
      flex: none;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: #1a120c;
      color: #fff8e4;
      font-size: 13px;
      font-weight: 800;
    }
    .tick { margin-left: auto; color: #3f6b38; font-weight: 800; font-size: 13px; }
    .side {
      border-radius: 12px;
      border: 2px solid var(--mq-gold-dark);
      background: #fff8e4;
      padding: 8px;
    }
    .side.peoples { border-color: var(--mq-people); }
    .side.democrats { border-color: var(--mq-democrats); }
    .side p { margin: 6px 0 0; font-size: 13px; line-height: 1.35; }
    .portrait {
      width: 92px;
      height: 118px;
      object-fit: contain;
      object-position: center bottom;
      flex: none;
    }
    .pick {
      display: block;
      width: 100%;
      text-align: left;
      margin-top: 6px;
      border: 2px solid var(--mq-gold-dark);
      border-radius: 10px;
      background: #fff8e4;
      padding: 6px 8px;
      cursor: pointer;
    }
    .pick.on { background: #f3dd96; box-shadow: inset 0 0 0 2px #4a2c0f; }
    .pick:disabled { cursor: default; }
  `,
  template: `
    <div class="space-y-3">
      <mq-guide where="civic" />
      @if (screen() === 'hall') {
        <div class="flex items-center gap-3">
          <img src="assets/places/civic.png" alt="" class="h-16 w-auto shrink-0" />
          <div>
            <p class="text-xs uppercase tracking-widest">Pin 2</p>
            <h2 class="text-2xl font-bold">
              Civic hall
              @if (agreed()) {
                <span class="text-base text-[#3f6b38]">· the youth has voted</span>
              }
            </h2>
            <p class="text-sm opacity-80">A youth in the hall. Read, speak, sign, hear, then vote.</p>
          </div>
        </div>

        <div class="space-y-2">
          <mq-nudge where="civic" />
          @for (step of steps; track step.id; let i = $index) {
            <button class="step" [class.done]="done()[step.id]" type="button" [disabled]="!openTo(step.id)" (click)="open(step.id)">
              <span class="num">{{ i + 1 }}</span>
              <span>
                <span class="block font-bold">{{ step.name }}</span>
                <span class="block text-xs opacity-70">{{ step.hint }}</span>
              </span>
              <span class="tick">{{ done()[step.id] ? 'Done' : openTo(step.id) ? '' : 'Locked' }}</span>
            </button>
          }
        </div>
        <p class="text-xs opacity-70">{{ doneCount() }} of 5 done</p>

        <section class="rounded-xl border-2 border-[var(--mq-gold-dark)] bg-[#fff8e4] p-3">
          <h3 class="font-bold">Clerk's card</h3>
          @if (!ready()) {
            <p class="mt-2 text-sm">The card waits until the ballot is sealed. Walk the hall in order.</p>
          } @else {
            <ul class="mt-2 list-disc pl-4 text-sm">
              <li>Both pledges read.</li>
              <li>You spoke for {{ pebble() }}.</li>
              <li>The roll has {{ harbourName() }}.</li>
              <li>You heard {{ peoples.contender }} and {{ democrats.contender }}.</li>
              <li>The ballot is sealed{{ sealedName() ? ' for ' + sealedName() : '' }}.</li>
            </ul>
            @if (agreed()) {
              <p class="mt-2 text-sm">The pledge is what the hall is voting on. The hours were spoken. The ballot is sealed.</p>
            } @else {
              <p class="mq-label mt-3">What is the hall deciding?</p>
              @for (opt of claims; track opt.id) {
                <button class="pick" [class.on]="claim() === opt.id" type="button" (click)="claim.set(opt.id)">{{ opt.label }}</button>
              }
              <button class="mq-btn mt-3" type="button" [disabled]="claim() === ''" (click)="file()">File the card</button>
              @if (miss()) {
                <p class="mt-2 text-sm">The clerk wants another look. The hall is deciding what was read on the wall.</p>
              }
            }
          }
        </section>
      } @else {
        <button class="mq-btn !py-1 text-sm" type="button" (click)="screen.set('hall')">← Back to the hall</button>
        @switch (screen()) {
          @case ('wall') {
            <h2 class="text-xl font-bold">The wall</h2>
            <div class="grid grid-cols-2 gap-2">
              <article class="side peoples">
                <p class="font-bold text-[var(--mq-people)]">People's Party</p>
                @for (line of peoples.pledges; track line) {
                  <p>{{ line }}</p>
                }
                <button class="pick" [class.on]="readPeoples()" type="button" (click)="readPeoples.set(true)">People's read</button>
              </article>
              <article class="side democrats">
                <p class="font-bold text-[var(--mq-democrats)]">Democratic Party</p>
                @for (line of democrats.pledges; track line) {
                  <p>{{ line }}</p>
                }
                <button class="pick" [class.on]="readDemocrats()" type="button" (click)="readDemocrats.set(true)">Democrats read</button>
              </article>
            </div>
          }
          @case ('meeting') {
            <h2 class="text-xl font-bold">The meeting</h2>
            <p class="text-sm">{{ game.poll().prompt }}</p>
            @for (row of game.pollTally(); track row.option) {
              <button
                class="pick"
                [class.on]="pebble() === row.option"
                type="button"
                [disabled]="votedPoll()"
                (click)="poll(row.option)"
              >
                <span>{{ row.option }}</span>
                <span class="float-right font-bold">{{ row.count }}</span>
              </button>
            }
            @if (votedPoll()) {
              <p class="mt-2 text-sm">The pebble is in the jar, for {{ pebble() }}.</p>
            }
            @if (msg()) {
              <p class="mt-2 text-sm">{{ msg() }}</p>
            }
          }
          @case ('roll') {
            <h2 class="text-xl font-bold">The roll</h2>
            <p class="text-sm">The hall list takes one harbour name.</p>
            <p class="mt-2 text-lg font-bold">{{ harbourName() }}</p>
            @if (!signed()) {
              <button class="mq-btn mt-3" type="button" (click)="signed.set(true)">Sign the roll</button>
            } @else {
              <p class="mt-2 text-sm">Signed. The hall has your name.</p>
            }
          }
          @case ('hearing') {
            <h2 class="text-xl font-bold">The hearing</h2>
            <div class="space-y-2">
              @for (side of sides; track side.slug) {
                <article class="side" [class.peoples]="side.slug === 'peoples'" [class.democrats]="side.slug === 'democrats'">
                  <div class="flex gap-3">
                    <img class="portrait" [src]="side.portrait" alt="" />
                    <div>
                      <p class="font-bold">{{ side.contender }}</p>
                      <p class="text-xs uppercase opacity-70">House of Representatives</p>
                      <p>{{ side.pitch }}</p>
                      <button class="pick" [class.on]="heard()[side.slug]" type="button" (click)="hear(side.slug)">
                        {{ heard()[side.slug] ? 'Heard' : 'Hear ' + side.contender }}
                      </button>
                    </div>
                  </div>
                </article>
              }
            </div>
          }
          @case ('ballot') {
            <h2 class="text-xl font-bold">The ballot</h2>
            @if (myBallot()) {
              <p class="text-sm">Sealed{{ sealedName() ? ' for ' + sealedName() : '' }}. One vote under this harbour name.</p>
            } @else {
              <p class="text-sm">One name. The paper closes when you cast it.</p>
              @for (side of sides; track side.slug) {
                <button class="pick" [class.on]="pick() === side.slug" type="button" (click)="pick.set(side.slug)">
                  <span class="font-bold">{{ side.contender }}</span>
                  <span class="block text-xs uppercase">{{ side.slug }}</span>
                  <span class="block text-sm">{{ side.pitch }}</span>
                  <span class="text-xs opacity-70">{{ votesFor(side.slug) }} vote(s)</span>
                </button>
              }
              <button class="mq-btn mq-btn-ink mt-3" type="button" [disabled]="pick() === ''" (click)="vote()">Cast ballot</button>
            }
            @if (msg()) {
              <p class="mt-2 text-sm">{{ msg() }}</p>
            }
          }
        }
      }
    </div>
  `,
})
export class CivicHouse {
  readonly game = inject(RoomService);
  private readonly path = inject(PathService);
  readonly steps = STEPS;
  readonly peoples: PartyOffice = partyOffice('peoples');
  readonly democrats: PartyOffice = partyOffice('democrats');
  readonly sides = [this.peoples, this.democrats];
  readonly claims = [
    { id: 'pledge', label: 'A youth centre is pledged for the square' },
    { id: 'date', label: 'The centre opens next month' },
    { id: 'built', label: 'Building has already started' },
  ];

  readonly screen = signal<'hall' | Step>('hall');
  readonly seen = signal<Record<Step, boolean>>({
    wall: false,
    meeting: false,
    roll: false,
    hearing: false,
    ballot: false,
  });
  readonly readPeoples = signal(false);
  readonly readDemocrats = signal(false);
  readonly signed = signal(false);
  readonly heard = signal<Record<'peoples' | 'democrats', boolean>>({ peoples: false, democrats: false });
  readonly pick = signal<'peoples' | 'democrats' | ''>('');
  readonly msg = signal('');
  readonly claim = signal('');
  readonly miss = signal(false);
  readonly agreed = signal(false);

  readonly harbourName = computed(() => this.game.me()?.alias || 'Harbour name');
  readonly pebble = computed(() => {
    const me = this.game.me();
    if (!me) return '';
    return this.game.pollVotes().find((vote) => vote.playerId === me.id)?.value ?? '';
  });
  readonly votedPoll = computed(() => this.pebble() !== '');
  readonly myBallot = computed(() => {
    const me = this.game.me();
    if (!me) return '';
    return this.game.ballots().find((ballot) => ballot.playerId === me.id)?.candidateId ?? '';
  });

  readonly done = computed(() => ({
    wall: this.readPeoples() && this.readDemocrats(),
    meeting: this.seen().meeting && this.votedPoll(),
    roll: this.signed(),
    hearing: this.heard().peoples && this.heard().democrats,
    ballot: this.seen().ballot && this.myBallot() !== '',
  }));
  readonly doneCount = computed(() => STEPS.filter((step) => this.done()[step.id]).length);
  readonly ready = computed(() => this.doneCount() === 5);

  openTo(id: Step): boolean {
    const order: Step[] = ['wall', 'meeting', 'roll', 'hearing', 'ballot'];
    const at = order.indexOf(id);
    return order.slice(0, at).every((step) => this.done()[step]);
  }

  open(id: Step): void {
    if (!this.openTo(id)) return;
    this.seen.update((state) => ({ ...state, [id]: true }));
    this.screen.set(id);
  }

  poll(option: string): void {
    const err = this.game.votePoll(option);
    if (err) this.msg.set(err);
  }

  hear(slug: 'peoples' | 'democrats'): void {
    this.heard.update((state) => ({ ...state, [slug]: true }));
  }

  votesFor(slug: 'peoples' | 'democrats'): number {
    const id = slug === 'peoples' ? 'hall-peoples' : 'hall-democrats';
    return this.game.ballots().filter((ballot) => ballot.candidateId === id).length;
  }

  sealedName(): string {
    if (this.myBallot() === 'hall-peoples') return this.peoples.contender;
    if (this.myBallot() === 'hall-democrats') return this.democrats.contender;
    return '';
  }

  vote(): void {
    const slug = this.pick();
    if (slug !== 'peoples' && slug !== 'democrats') return;
    const id = slug === 'peoples' ? 'hall-peoples' : 'hall-democrats';
    const err = this.game.castBallot(id);
    if (err) this.msg.set(err);
  }

  file(): void {
    const right = this.claim() === 'pledge';
    this.agreed.set(right);
    this.miss.set(!right);
    if (right) this.path.markCivic();
  }
}
