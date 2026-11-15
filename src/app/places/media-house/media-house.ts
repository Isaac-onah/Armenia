import { NgTemplateOutlet } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { PathService } from '../../core/path.service';
import { Guide } from '../../shared/guide';
import { Nudge } from '../../shared/nudge';

type Medium = 'tv' | 'x' | 'tiktok' | 'instagram' | 'ledger';
type Screen = 'desk' | Medium;

const DOORS: { id: Medium; name: string; hint: string }[] = [
  { id: 'tv', name: 'Live TV', hint: 'Island bulletin' },
  { id: 'x', name: 'X', hint: 'Posts and replies' },
  { id: 'tiktok', name: 'TikTok', hint: 'A short clip' },
  { id: 'instagram', name: 'Instagram', hint: 'A photo and comments' },
  { id: 'ledger', name: 'Harbour Ledger', hint: 'The news site' },
];

@Component({
  selector: 'mq-media-house',
  imports: [NgTemplateOutlet, Guide, Nudge],
  styles: `
    .door {
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
    .door.seen { box-shadow: inset 3px 0 0 #3f6b38; }
    .mark {
      width: 36px;
      height: 36px;
      flex: none;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
      border-radius: 10px;
      color: white;
    }
    .mark.tv { background: #1a120c; }
    .mark.x { background: #111; }
    .mark.tiktok { background: #111; }
    .mark.instagram { background: linear-gradient(135deg, #f7ce68, #e1306c 55%, #4f5bd5); }
    .mark.ledger { background: #f4efe4; border: 1px solid #1a120c; }
    .mark svg {
      width: 24px;
      height: 24px;
      min-width: 24px;
      flex: none;
      display: block;
    }
    .mark.mini { width: 28px; height: 28px; border-radius: 8px; }
    .mark.mini svg { width: 18px; height: 18px; min-width: 18px; }
    .brand { display: flex; align-items: center; gap: 8px; }
    .clip-logo {
      position: absolute;
      top: 10px;
      left: 10px;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #111;
      display: grid;
      place-items: center;
    }
    .clip-logo svg { width: 20px; height: 20px; }
    .tick { margin-left: auto; color: #3f6b38; font-weight: 800; }
    .back { margin-bottom: 8px; }
    .tv {
      border: 10px solid #2a1a10;
      border-radius: 28px;
      background: #1a120c;
      padding: 8px;
    }
    .screen {
      position: relative;
      overflow: hidden;
      border-radius: 6px;
      background: #102833;
      color: #fff8e4;
      display: flex;
      flex-direction: column;
    }
    .studio {
      display: block;
      width: 100%;
      height: auto;
    }
    .lower {
      position: relative;
      z-index: 2;
      height: 124px;
      padding: 6px 10px 8px;
      background: #120e0a;
      border-top: 3px solid #e8c547;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .crawl {
      height: 5.6em;
      overflow: hidden;
      font-size: 0.86rem;
      line-height: 1.35;
    }
    .crawl-track p { margin: 0 0 0.55em; }
    .crawl-track.run { animation: rise 9s linear 0.45s forwards; }
    @keyframes rise {
      from { transform: translateY(0); }
      to { transform: translateY(calc(-100% + 5.6em)); }
    }
    .reporters {
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #e8c547;
    }
    .live {
      position: absolute;
      z-index: 3;
      top: 8px;
      left: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      letter-spacing: 0.14em;
    }
    .live i {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #e23b3b;
      box-shadow: 0 0 0 3px rgba(226, 59, 59, 0.35);
    }
    .xpost, .igpost {
      border: 1px solid #eff3f4;
      border-radius: 16px;
      background: #fff;
      color: #0f1419;
      font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
      overflow: hidden;
    }
    .xbar {
      display: flex;
      justify-content: center;
      padding: 8px;
      border-bottom: 1px solid #eff3f4;
    }
    .tweet {
      position: relative;
      display: grid;
      grid-template-columns: 40px 1fr;
      gap: 10px;
      padding: 12px 12px 8px;
    }
    .tweet + .tweet { padding-top: 4px; }
    .thread {
      position: absolute;
      left: 31px;
      top: 56px;
      bottom: 0;
      width: 2px;
      background: #cfd9de;
    }
    .xav {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 12px;
      font-weight: 800;
      color: white;
      background: #c45c3e;
    }
    .xav.reader { background: #2f6f8f; }
    .xwho { display: flex; align-items: center; gap: 4px; min-width: 0; font-size: 15px; }
    .xname { font-weight: 800; }
    .xhandle, .xmeta { color: #536471; font-size: 15px; }
    .xhandle { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .xmore { margin-left: auto; color: #536471; letter-spacing: 0.08em; }
    .badge { width: 16px; height: 16px; flex: none; }
    .xtext { margin: 2px 0 0; font-size: 15px; line-height: 1.35; }
    .xmeta { margin: 10px 0 0; font-size: 13px; }
    .xmeta b { color: #0f1419; }
    .xactions {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      padding-bottom: 4px;
      color: #536471;
      font-size: 13px;
    }
    .xactions span, .igleft, .igbar { display: flex; align-items: center; gap: 6px; }
    .xactions svg, .igbar svg, .tt-rail svg { width: 18px; height: 18px; display: block; }
    .phone {
      width: min(100%, 300px);
      margin: 0 auto;
      border: 8px solid #111;
      border-radius: 32px;
      overflow: hidden;
      background: #000;
      color: white;
      font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
    }
    .clip { position: relative; height: 540px; }
    .clip .scene { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
    .clip::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 180px;
      background: linear-gradient(transparent, rgba(0, 0, 0, 0.78));
    }
    .tt-top {
      position: absolute;
      z-index: 2;
      top: 16px;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      gap: 16px;
      font-size: 15px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.72);
      text-shadow: 0 1px 2px #000;
    }
    .tt-top .on { color: #fff; }
    .tt-top .on::after {
      content: '';
      display: block;
      width: 26px;
      height: 3px;
      margin: 4px auto 0;
      border-radius: 3px;
      background: #fff;
    }
    .tt-rail {
      position: absolute;
      z-index: 2;
      right: 8px;
      bottom: 18px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      font-size: 12px;
      font-weight: 700;
      text-align: center;
    }
    .tt-ava {
      position: relative;
      width: 44px;
      height: 44px;
      margin-bottom: 6px;
      border: 2px solid #fff;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: #c45c3e;
      font-weight: 800;
    }
    .tt-ava i {
      position: absolute;
      left: 50%;
      bottom: -8px;
      width: 18px;
      height: 18px;
      transform: translateX(-50%);
      border-radius: 50%;
      background: #fe2c55;
      font-style: normal;
      font-size: 14px;
      line-height: 18px;
    }
    .tt-rail span { display: grid; justify-items: center; gap: 2px; }
    .tt-rail svg { width: 28px; height: 28px; }
    .disc {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: 8px solid #1a1a1a;
      background: conic-gradient(#3a3a3a, #111, #555, #111, #3a3a3a);
    }
    .tt-meta {
      position: absolute;
      z-index: 2;
      left: 12px;
      right: 64px;
      bottom: 16px;
      font-size: 14px;
      line-height: 1.3;
      text-shadow: 0 1px 2px #000;
    }
    .tt-meta p { margin: 4px 0 0; }
    .sound { font-size: 13px; }
    .igpost { border-color: #dbdbdb; color: #262626; }
    .ighead, .igbar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
    }
    .ighead b, .ighead .loc { display: block; line-height: 1.15; }
    .ighead b { font-size: 14px; }
    .loc { font-size: 12px; }
    .more { margin-left: auto; letter-spacing: 0.12em; font-weight: 800; }
    .ring {
      width: 38px;
      height: 38px;
      flex: none;
      padding: 2px;
      border-radius: 50%;
      background: linear-gradient(135deg, #feda75, #fa7e1e 35%, #d62976 60%, #962fbf, #4f5bd5);
    }
    .ring i {
      display: grid;
      place-items: center;
      width: 100%;
      height: 100%;
      border: 2px solid #fff;
      border-radius: 50%;
      background: #2f6f8f;
      color: white;
      font-style: normal;
      font-size: 11px;
      font-weight: 800;
    }
    .photo { background: #7eae58; aspect-ratio: 1; }
    .photo svg { width: 100%; height: 100%; display: block; }
    .igbar { padding-top: 10px; padding-bottom: 4px; }
    .igbar svg { width: 24px; height: 24px; }
    .igleft { gap: 14px; }
    .save { margin-left: auto; }
    .likes, .caption, .viewall, .comment, .when { margin: 0; padding: 0 12px; font-size: 14px; line-height: 1.35; }
    .likes { font-weight: 700; }
    .caption { margin-top: 4px; }
    .viewall, .when { color: #8e8e8e; }
    .viewall { margin-top: 6px; font-size: 14px; }
    .comment { margin-top: 2px; }
    .when { margin-top: 8px; padding-bottom: 12px; font-size: 10px; letter-spacing: 0.04em; text-transform: uppercase; }
    .ledger {
      background:
        repeating-linear-gradient(0deg, transparent, transparent 15px, rgba(74, 44, 15, 0.04) 16px),
        #f4efe4;
      color: #1a120c;
      font-family: Georgia, 'Palatino Linotype', Palatino, serif;
      padding: 12px 12px 16px;
    }
    .flag {
      text-align: center;
      font-size: 10px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
    }
    .mast {
      margin: 0;
      text-align: center;
      font-size: 1.85rem;
      line-height: 0.95;
      letter-spacing: 0.02em;
      font-weight: 700;
    }
    .dateline {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
      padding: 3px 0;
      border-top: 3px solid #1a120c;
      border-bottom: 1px solid #1a120c;
      font-size: 10px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }
    .headline {
      margin: 8px 0 0;
      font-size: 1.35rem;
      line-height: 1.05;
      font-weight: 700;
    }
    .deck {
      margin: 4px 0 0;
      font-size: 0.8rem;
      font-style: italic;
    }
    .cols {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 8px;
    }
    .cols p { margin: 0; font-size: 12.5px; line-height: 1.35; }
    .cols p + p { margin-top: 8px; }
    .reporter {
      display: flex;
      gap: 10px;
      align-items: flex-end;
      margin: 12px 0 0;
      padding-top: 8px;
      border-top: 1px solid #1a120c;
    }
    .reporter img {
      width: 112px;
      height: 156px;
      flex: none;
      object-fit: contain;
      object-position: center bottom;
    }
    .reporter figcaption { margin: 0 0 6px; font-size: 12.5px; line-height: 1.35; }
    .cols div + div { border-left: 1px solid #1a120c; padding-left: 12px; }
    .drop {
      float: left;
      margin: 2px 4px 0 0;
      font-size: 2rem;
      line-height: 0.8;
      font-weight: 700;
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
  `,
  template: `
    <ng-template #brand let-id="id">
      <svg viewBox="0 0 36 36" aria-hidden="true">
        @switch (id) {
          @case ('tv') {
            <g transform="translate(0 1)">
              <path d="M11 8 L18 12 L25 8" fill="none" stroke="#e8c547" stroke-width="2" stroke-linecap="round" />
              <rect x="8" y="12" width="20" height="14" rx="2" fill="none" stroke="#e8c547" stroke-width="2" />
              <path d="M16 16 L16 22 L22 19 Z" fill="#e8c547" />
              <circle cx="24.5" cy="15" r="1.5" fill="#e23b3b" />
            </g>
          }
          @case ('x') {
            <path d="M8 8 L28 28 M28 8 L8 28" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" />
          }
          @case ('tiktok') {
            <g transform="translate(-1.4 1.2)">
              <ellipse cx="13" cy="25" rx="5" ry="3.6" fill="#25f4ee" />
              <rect x="17" y="8" width="2.6" height="17" fill="#25f4ee" />
              <path d="M19.6 8c6 1 8 6 8 8 0-4-3-6-8-6z" fill="#25f4ee" />
            </g>
            <g transform="translate(1.4 -1)">
              <ellipse cx="13" cy="25" rx="5" ry="3.6" fill="#fe2c55" />
              <rect x="17" y="8" width="2.6" height="17" fill="#fe2c55" />
              <path d="M19.6 8c6 1 8 6 8 8 0-4-3-6-8-6z" fill="#fe2c55" />
            </g>
            <ellipse cx="13" cy="25" rx="5" ry="3.6" fill="#fff" />
            <rect x="17" y="8" width="2.6" height="17" fill="#fff" />
            <path d="M19.6 8c6 1 8 6 8 8 0-4-3-6-8-6z" fill="#fff" />
          }
          @case ('instagram') {
            <rect x="7" y="7" width="22" height="22" rx="6" fill="none" stroke="#fff" stroke-width="2.2" />
            <circle cx="18" cy="18" r="5.5" fill="none" stroke="#fff" stroke-width="2.2" />
            <circle cx="25" cy="12" r="1.6" fill="#fff" />
          }
          @case ('ledger') {
            <rect x="9" y="6" width="18" height="24" rx="1.5" fill="none" stroke="#1a120c" stroke-width="1.8" />
            <path d="M12 12 h12 M12 16 h12 M12 20 h12 M12 24 h8" stroke="#1a120c" stroke-width="1.4" stroke-linecap="round" />
          }
        }
      </svg>
    </ng-template>
    <div class="space-y-3">
      <mq-guide where="media" />
      @if (screen() === 'desk') {
        <div class="flex items-center gap-3">
          <img src="assets/places/media.png" alt="" class="h-20 w-auto shrink-0" />
          <div>
            <p class="text-xs uppercase tracking-widest">Pin 1</p>
            <h2 class="text-2xl font-bold">
              Media house
              @if (agreed()) {
                <span class="text-base text-[#3f6b38]">· desk agrees</span>
              }
            </h2>
            <p class="text-sm opacity-80">The news desk. Open every medium, then file what they share.</p>
          </div>
        </div>

        <div class="space-y-2">
          <mq-nudge where="media" />
          @for (door of doors; track door.id) {
            <button class="door" [class.seen]="opened()[door.id]" type="button" (click)="open(door.id)">
              <span [class]="'mark ' + door.id">
                <ng-container [ngTemplateOutlet]="brand" [ngTemplateOutletContext]="{ id: door.id }" />
              </span>
              <span>
                <span class="block font-bold">{{ door.name }}</span>
                <span class="block text-xs opacity-70">{{ door.hint }}</span>
              </span>
              @if (opened()[door.id]) {
                <span class="tick">Seen</span>
              }
            </button>
          }
        </div>
        <p class="text-xs opacity-70">{{ seenCount() }} of 5 opened</p>

        <section class="rounded-xl border-2 border-[var(--mq-gold-dark)] bg-[#fff8e4] p-3">
          <h3 class="font-bold">Desk note</h3>
          @if (!ready()) {
            <p class="mt-2 text-sm">Open live TV, X, TikTok, Instagram, and the Harbour Ledger. The note unlocks after the fifth.</p>
          } @else if (agreed()) {
            <p class="mt-2 text-sm">The pledge is the story. TikTok stretched it. It needs a source before it can run.</p>
          } @else {
            <p class="mq-label mt-3">What do all five agree on?</p>
            @for (opt of claims; track opt.id) {
              <button class="pick" [class.on]="claim() === opt.id" type="button" (click)="claim.set(opt.id)">{{ opt.label }}</button>
            }
            <p class="mq-label mt-3">Which medium stretched it?</p>
            @for (opt of doors; track opt.id) {
              <button class="pick" [class.on]="stretched() === opt.id" type="button" (click)="stretched.set(opt.id)">{{ opt.name }}</button>
            }
            <p class="mq-label mt-3">Stamp</p>
            @for (opt of stamps; track opt.id) {
              <button class="pick" [class.on]="stamp() === opt.id" type="button" (click)="stamp.set(opt.id)">{{ opt.label }}</button>
            }
            <button class="mq-btn mt-3" type="button" [disabled]="!canFile()" (click)="file()">File the note</button>
            @if (miss()) {
              <p class="mt-2 text-sm">The desk wants another look. Find what all five share, and which one added a claim the others did not.</p>
            }
          }
        </section>
      } @else {
        <button class="mq-btn back !py-1 text-sm" type="button" (click)="screen.set('desk')">← Back to the desk</button>
        @switch (screen()) {
          @case ('tv') {
            <div class="tv">
              <div class="screen">
                <p class="live"><i></i> LIVE</p>
                <img class="studio" src="assets/media/news-desk.jpg?v=2" alt="" />
                <div class="lower">
                  <p class="reporters">Mara · the square &nbsp;&nbsp; Leo · the harbour</p>
                  <div class="crawl">
                    <div class="crawl-track" [class.run]="crawl()">
                      <p>Good evening from the island desk. The People's Party has pledged a youth centre on the square, with a hall the ferry towns could use after school.</p>
                      <p>Luca Vella repeated that promise from the party office. The Democratic Party says the House has not seen the bill. Andre Galea said the island should read the paper before the headline.</p>
                      <p>This bulletin carries no opening date. No work has started on the square. The pledge is the story, and it still needs a source.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="mt-2 flex items-center justify-between px-2 text-[#e8c547]">
                <span class="brand text-xs tracking-widest">
                  <span class="mark tv mini">
                    <ng-container [ngTemplateOutlet]="brand" [ngTemplateOutletContext]="{ id: 'tv' }" />
                  </span>
                  MQ-TV
                </span>
                <span class="h-3 w-3 rounded-full bg-red-600"></span>
              </div>
            </div>
          }
          @case ('x') {
            <div class="xpost">
              <div class="xbar">
                <span class="mark x mini">
                  <ng-container [ngTemplateOutlet]="brand" [ngTemplateOutletContext]="{ id: 'x' }" />
                </span>
              </div>
              <article class="tweet">
                <span class="thread"></span>
                <div class="xav">PP</div>
                <div>
                  <div class="xwho">
                    <span class="xname">People's Party</span>
                    <svg class="badge" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="#1d9bf0" /><path d="M4.4 8.2 L7 10.6 L11.6 5.4" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" /></svg>
                    <span class="xhandle">&#64;peoplesparty</span>
                    <span class="xhandle">· 2h</span>
                    <span class="xmore">···</span>
                  </div>
                  <p class="xtext">The youth centre opens next month. The square will have its hall.</p>
                  <p class="xmeta">Monday · <b>18.4K</b> Views</p>
                  <div class="xactions">
                    <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16.5c-2.4-.8-4-2.6-4-4.8C2 8.2 6.2 5.5 12 5.5s10 2.7 10 6.2-4.2 6.2-10 6.2c-.8 0-1.6 0-2.3-.2L6 19.8v-3.3z" fill="none" stroke="currentColor" stroke-width="1.6" /></svg> 128</span>
                    <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h8.5L13 4.5M17 17H8.5L11 19.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /><path d="M15.5 7V12M8.5 17v-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg> 640</span>
                    <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19s-6.5-4-6.5-8.2A3.4 3.4 0 0 1 12 8.2a3.4 3.4 0 0 1 6.5 2.6C18.5 15 12 19 12 19z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" /></svg> 2.1K</span>
                    <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 17V11 M10 17V7 M15 17V12 M20 17V5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg> 18K</span>
                  </div>
                </div>
              </article>
              <article class="tweet">
                <div class="xav reader">FW</div>
                <div>
                  <div class="xwho">
                    <span class="xname">Ferry watch</span>
                    <span class="xhandle">&#64;ferrywatch</span>
                    <span class="xhandle">· 1h</span>
                    <span class="xmore">···</span>
                  </div>
                  <p class="xtext">The House has not seen the bill.</p>
                  <div class="xactions">
                    <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16.5c-2.4-.8-4-2.6-4-4.8C2 8.2 6.2 5.5 12 5.5s10 2.7 10 6.2-4.2 6.2-10 6.2c-.8 0-1.6 0-2.3-.2L6 19.8v-3.3z" fill="none" stroke="currentColor" stroke-width="1.6" /></svg> 24</span>
                    <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h8.5L13 4.5M17 17H8.5L11 19.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /><path d="M15.5 7V12M8.5 17v-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg> 11</span>
                    <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19s-6.5-4-6.5-8.2A3.4 3.4 0 0 1 12 8.2a3.4 3.4 0 0 1 6.5 2.6C18.5 15 12 19 12 19z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" /></svg> 86</span>
                    <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 17V11 M10 17V7 M15 17V12 M20 17V5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg> 1.2K</span>
                  </div>
                </div>
              </article>
            </div>
          }
          @case ('tiktok') {
            <div class="phone">
              <div class="clip">
                <svg class="scene" viewBox="0 0 200 340" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                  <rect width="200" height="340" fill="#6ea352" />
                  <path d="M10 250 C 60 210, 120 270, 190 200" fill="none" stroke="#d7b57a" stroke-width="18" stroke-linecap="round" />
                  <circle cx="40" cy="70" r="22" fill="#3f6b38" />
                  <rect x="36" y="84" width="8" height="28" fill="#8b5a12" />
                  <circle cx="160" cy="90" r="18" fill="#4f7d40" />
                  <rect x="70" y="150" width="60" height="28" rx="4" fill="#e7c98a" stroke="#4a2c0f" />
                </svg>
                <div class="tt-top"><span>Live</span><span>Following</span><span class="on">For You</span></div>
                <div class="tt-rail">
                  <div class="tt-ava">SC<i>+</i></div>
                  <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19s-6.5-4-6.5-8.2A3.4 3.4 0 0 1 12 8.2a3.4 3.4 0 0 1 6.5 2.6C18.5 15 12 19 12 19z" fill="#fff" stroke="#fff" stroke-width="1.2" stroke-linejoin="round" /></svg>18.2K</span>
                  <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16.5c-2.4-.8-4-2.6-4-4.8C2 8.2 6.2 5.5 12 5.5s10 2.7 10 6.2-4.2 6.2-10 6.2c-.8 0-1.6 0-2.3-.2L6 19.8v-3.3z" fill="#fff" /></svg>902</span>
                  <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10a1 1 0 0 1 1 1v14l-6-3.2L6 19V5a1 1 0 0 1 1-1z" fill="#fff" /></svg>1,104</span>
                  <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 4 L20 11 L13 11 L13 20 L10 20 L10 11 L4 11 Z" fill="#fff" /></svg>4,021</span>
                  <div class="disc"></div>
                </div>
                <div class="tt-meta">
                  <b>&#64;squareclip</b>
                  <p>They have already started building</p>
                  <p class="sound">♪ original sound - squareclip</p>
                </div>
              </div>
            </div>
          }
          @case ('instagram') {
            <article class="igpost">
              <header class="ighead">
                <span class="ring"><i>SW</i></span>
                <div>
                  <b>squarewatch</b>
                  <span class="loc">The square</span>
                </div>
                <span class="more">···</span>
              </header>
              <div class="photo">
                <svg viewBox="0 0 320 320" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                  <rect width="320" height="320" fill="#7eae58" />
                  <path d="M0 230 C 80 190, 160 260, 320 200" fill="none" stroke="#d7b57a" stroke-width="22" />
                  <circle cx="64" cy="78" r="22" fill="#3f6b38" />
                  <rect x="58" y="92" width="12" height="28" fill="#8b5a12" />
                  <rect x="118" y="132" width="84" height="36" rx="4" fill="#e7c98a" stroke="#4a2c0f" />
                </svg>
              </div>
              <div class="igbar">
                <span class="igleft">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19s-6.5-4-6.5-8.2A3.4 3.4 0 0 1 12 8.2a3.4 3.4 0 0 1 6.5 2.6C18.5 15 12 19 12 19z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" /></svg>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16.5c-2.4-.8-4-2.6-4-4.8C2 8.2 6.2 5.5 12 5.5s10 2.7 10 6.2-4.2 6.2-10 6.2c-.8 0-1.6 0-2.3-.2L6 19.8v-3.3z" fill="none" stroke="currentColor" stroke-width="1.7" /></svg>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11 L20 4 L13 20 L11 13 Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" /></svg>
                </span>
                <svg class="save" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.2L6 20V5a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" /></svg>
              </div>
              <p class="likes">846 likes</p>
              <p class="caption"><b>squarewatch</b> Still a promise. The square is empty tonight.</p>
              <p class="viewall">View all 64 comments</p>
              <p class="comment"><b>ferrywatch</b> Then where is the date?</p>
              <p class="comment"><b>quietquay</b> Come and see it. Nothing is up.</p>
              <p class="when">Monday</p>
            </article>
          }
          @case ('ledger') {
            <article class="ledger">
              <p class="flag">The civic paper of the island</p>
              <h2 class="mast">The Harbour Ledger</h2>
              <p class="dateline"><span>Valletta</span><span>Monday</span><span>Two cents</span></p>
              <h3 class="headline">Youth centre pledge reaches the square, not the House</h3>
              <p class="deck">People's repeat the hall. Democrats say the bill has not arrived.</p>
              <div class="cols">
                <div>
                  <p>
                    <span class="drop">T</span>he People's Party has pledged a youth centre on the square, with a hall the ferry towns could use after school. Luca Vella repeated the promise from the party office.
                  </p>
                  <p>
                    The pledge also names a yard that stays lit in the evening. Vella said it would be put back on paper before this House rises. He did not give an opening date.
                  </p>
                </div>
                <div>
                  <p>
                    The Democratic Party says the House has not seen the bill. Andre Galea told this desk the island should read the paper before the headline.
                  </p>
                  <p>
                    The Ledger has found no opening date, and no work has started on the square. Shopkeepers on the quay have heard the promise. They have not seen a builder.
                  </p>
                </div>
              </div>
              <figure class="reporter">
                <img src="assets/media/ledger-reporter.png" alt="" />
                <figcaption>
                  <b>From the square.</b> The Ledger's reporter walked the yard after the pledge. The ground is still empty. Nothing is up, and no date is posted.
                </figcaption>
              </figure>
            </article>
          }
        }
      }
    </div>
  `,
})
export class MediaHouse implements OnDestroy {
  private readonly path = inject(PathService);
  readonly doors = DOORS;
  readonly screen = signal<Screen>('desk');
  readonly opened = signal<Record<Medium, boolean>>({
    tv: false,
    x: false,
    tiktok: false,
    instagram: false,
    ledger: false,
  });
  readonly crawl = signal(false);
  readonly claim = signal('');
  readonly stretched = signal<Medium | ''>('');
  readonly stamp = signal('');
  readonly miss = signal(false);
  readonly agreed = signal(false);
  private crawlKick: number | null = null;

  readonly seenCount = computed(() => Object.values(this.opened()).filter(Boolean).length);
  readonly ready = computed(() => this.seenCount() === 5);
  readonly canFile = computed(() => this.claim() !== '' && this.stretched() !== '' && this.stamp() !== '');

  readonly claims = [
    { id: 'pledge', label: 'A youth centre is pledged for the square' },
    { id: 'date', label: 'The centre opens next month' },
    { id: 'built', label: 'Building has already started' },
  ];
  readonly stamps = [
    { id: 'run', label: 'Run it' },
    { id: 'needs_source', label: 'Needs a source' },
    { id: 'rumour', label: 'Rumour' },
  ];

  open(id: Medium): void {
    this.opened.update((state) => ({ ...state, [id]: true }));
    this.screen.set(id);
    if (id === 'tv') this.startBulletin();
    else this.stopBulletin();
  }

  file(): void {
    const right = this.claim() === 'pledge' && this.stretched() === 'tiktok' && this.stamp() === 'needs_source';
    this.agreed.set(right);
    this.miss.set(!right);
    if (right) this.path.markMedia();
  }

  ngOnDestroy(): void {
    this.stopBulletin();
  }

  private startBulletin(): void {
    this.stopBulletin();
    this.crawlKick = window.setTimeout(() => this.crawl.set(true), 40);
  }

  private stopBulletin(): void {
    if (this.crawlKick !== null) {
      window.clearTimeout(this.crawlKick);
      this.crawlKick = null;
    }
    this.crawl.set(false);
  }
}
