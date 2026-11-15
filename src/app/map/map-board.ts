import { Component, ElementRef, HostListener, afterNextRender, computed, effect, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { PIN_DEFS, type PlaceSlug } from '../core/models';
import { PathService } from '../core/path.service';
import { RoomService } from '../core/room.service';
import { Guide } from '../shared/guide';
import { ParchmentFrame } from '../shared/parchment-frame';
import { travelTransform } from './travel';

@Component({
  selector: 'mq-map-board',
  imports: [ParchmentFrame, RouterOutlet, Guide],
  styleUrl: './map-board.css',
  templateUrl: './map-board.html',
})
export class MapBoard {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly game = inject(RoomService);
  readonly path = inject(PathService);

  readonly code = signal(this.route.snapshot.paramMap.get('code') ?? 'DEMO');
  readonly child = signal(childOf(this.router.url));
  readonly note = signal('');
  readonly noteLeaving = signal(false);
  readonly live = signal(false);
  private noteTimer = 0;
  private liveTimer = 0;
  readonly isScreen = computed(() => this.child() === 'screen');
  readonly overlayOpen = computed(() => {
    const c = this.child();
    return c !== '' && c !== 'screen';
  });
  readonly stageTransform = signal('translate(0px, 0px) scale(1)');
  readonly panning = signal(false);
  readonly handEdge = signal<'' | 'left' | 'right' | 'top' | 'bottom'>('');
  panX = 0;
  panY = 0;
  /** Smallest scale is the view the island loads at. */
  scale = 1;
  private drag: { x: number; y: number; panX: number; panY: number } | null = null;
  private readonly pointers = new Map<number, { x: number; y: number }>();
  private pinchDist = 0;
  private pinchScale = 1;
  private readonly stageRef = viewChild<ElementRef<HTMLElement>>('stage');
  private readonly watchHand = effect(() => {
    this.path.stage();
    this.path.skipped(this.path.stage());
    this.stageTransform();
    this.overlayOpen();
    queueMicrotask(() => this.placeHand());
  });

  readonly pins = PIN_DEFS;
  readonly trail = snakePath([
    PIN_DEFS.square,
    PIN_DEFS.peoples,
    PIN_DEFS.civic,
    PIN_DEFS.media,
    PIN_DEFS.democrats,
  ]);
  readonly pinList = Object.entries(PIN_DEFS) as [Exclude<PlaceSlug, 'tv' | 'screen'>, (typeof PIN_DEFS)['media']][];

  constructor() {
    this.route.paramMap.subscribe((p) => this.code.set(p.get('code') ?? 'DEMO'));
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      const place = childOf(this.router.url);
      this.child.set(place);
      if (this.blocked(place)) {
        void this.router.navigate(['/map', this.code()], { replaceUrl: true });
        return;
      }
      this.syncCamera();
    });
    afterNextRender(() => this.syncCamera());
  }

  travelTo(place: Exclude<PlaceSlug, 'tv' | 'screen'>): void {
    if (this.isScreen() || !this.path.placeOpen(place)) return;
    this.releaseLive();
    this.stageTransform.set(this.focusOn(place));
    window.setTimeout(() => {
      void this.router.navigate(['/map', this.code(), place]);
    }, GLIDE_MS);
  }

  back(): void {
    this.home();
    void this.router.navigate(['/map', this.code()]);
  }

  onPointerDown(ev: PointerEvent): void {
    if (this.isScreen()) return;
    this.pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (this.overlayOpen()) return;
    if (this.pointers.size >= 2) {
      this.drag = null;
      this.panning.set(false);
      this.pinchDist = this.pointerSpan();
      this.pinchScale = this.scale;
      return;
    }
    if ((ev.target as HTMLElement).closest('.pin, .chrome, .place-sheet, .note-card')) return;
    this.drag = { x: ev.clientX, y: ev.clientY, panX: this.panX, panY: this.panY };
    this.panning.set(true);
    (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
  }

  onPointerMove(ev: PointerEvent): void {
    if (!this.pointers.has(ev.pointerId)) return;
    this.pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (this.pointers.size >= 2 && this.pinchDist > 0) {
      this.markLive();
      const dist = this.pointerSpan();
      this.scale = Math.min(MAX_SCALE, Math.max(1, this.pinchScale * (dist / this.pinchDist)));
      this.stageTransform.set(this.baseTransform());
      return;
    }
    if (!this.drag) return;
    this.panX = this.drag.panX + (ev.clientX - this.drag.x);
    this.panY = this.drag.panY + (ev.clientY - this.drag.y);
    this.stageTransform.set(this.baseTransform());
  }

  onPointerUp(ev: PointerEvent): void {
    this.pointers.delete(ev.pointerId);
    if (this.pointers.size < 2) this.pinchDist = 0;
    if (this.pointers.size === 0) {
      this.drag = null;
      this.panning.set(false);
    }
  }

  @HostListener('wheel', ['$event'])
  onWheel(ev: WheelEvent): void {
    if (this.overlayOpen() || this.isScreen()) return;
    ev.preventDefault();
    this.markLive();
    const next = Math.min(MAX_SCALE, Math.max(1, this.scale + (ev.deltaY < 0 ? 0.08 : -0.08)));
    this.scale = next;
    this.stageTransform.set(this.baseTransform());
  }

  @HostListener('window:resize')
  onResize(): void {
    this.placeHand();
  }

  aimNext(): void {
    this.releaseLive();
    const place = this.path.focusPlace();
    if (!place) return;
    const next = this.focusOn(place);
    const read = readTransform(next);
    this.panX = read.x;
    this.panY = read.y;
    this.scale = Math.max(1, read.scale);
    this.stageTransform.set(next);
  }

  toggleNote(id: string): void {
    if (this.note() === id && !this.noteLeaving()) {
      this.closeNote();
      return;
    }
    window.clearTimeout(this.noteTimer);
    this.noteLeaving.set(false);
    this.note.set(id);
  }

  closeNote(): void {
    if (!this.note() || this.noteLeaving()) return;
    this.noteLeaving.set(true);
    window.clearTimeout(this.noteTimer);
    this.noteTimer = window.setTimeout(() => {
      if (!this.noteLeaving()) return;
      this.note.set('');
      this.noteLeaving.set(false);
    }, 280);
  }

  noteTitle(): string {
    switch (this.note()) {
      case 'score':
        return 'Island score';
      case 'hint':
        return 'Hint';
      case 'trust':
        return 'Island trust';
      case 'week':
        return 'The week';
      case 'issue':
        return 'The question';
      case 'mock':
        return 'Practice island';
      default:
        return '';
    }
  }

  noteBody(): string {
    switch (this.note()) {
      case 'hint':
        return this.path.hint();
      case 'trust':
        return `Trust is ${this.game.me()?.trust ?? 0}. It rises when a stop is finished: the playground, each party house, the media desk, and the vote.`;
      case 'week': {
        const status = this.game.room().status;
        if (status === 'live') return 'The election week is running. This chip counts the time left.';
        if (status === 'recap') return 'The week is over. The island is in recap.';
        return 'The host has not started the week. You can still walk the whole path.';
      }
      case 'issue':
        return this.game.room().issueBanner;
      case 'mock':
        return 'This is a practice room saved in this browser. The path, the pebble, and the ballot stay here.';
      default:
        return '';
    }
  }

  holdCompass(ev: Event): void {
    ev.stopPropagation();
  }

  recenter(ev: Event): void {
    ev.stopPropagation();
    this.home();
  }

  skip(): void {
    this.path.foldCard();
  }

  handTransform(): string {
    const place = this.path.focusPlace();
    if (!place) return 'translate(0 0)';
    const pin = PIN_DEFS[place];
    return `translate(${pin.cx - 86} ${pin.cy - 18})`;
  }

  showMapHand(): boolean {
    const stage = this.path.stage();
    return this.path.focusPlace() !== null && stage !== 'done' && !this.path.skipped(stage) && !this.overlayOpen() && !this.isScreen() && this.handEdge() === '';
  }

  private blocked(place: string): boolean {
    if (place !== 'square' && place !== 'peoples' && place !== 'democrats' && place !== 'media' && place !== 'civic') {
      return false;
    }
    return !this.path.placeOpen(place);
  }

  private markLive(): void {
    this.live.set(true);
    window.clearTimeout(this.liveTimer);
    this.liveTimer = window.setTimeout(() => this.live.set(false), 180);
  }

  private releaseLive(): void {
    window.clearTimeout(this.liveTimer);
    this.live.set(false);
  }

  private home(): void {
    this.releaseLive();
    this.panX = 0;
    this.panY = 0;
    this.scale = 1;
    this.stageTransform.set(this.baseTransform());
  }

  private pointerSpan(): number {
    const pts = [...this.pointers.values()];
    if (pts.length < 2) return 0;
    const dx = pts[0].x - pts[1].x;
    const dy = pts[0].y - pts[1].y;
    return Math.hypot(dx, dy) || 1;
  }

  private placeHand(): void {
    const place = this.path.focusPlace();
    const stage = this.path.stage();
    if (!place || stage === 'done' || this.path.skipped(stage) || this.overlayOpen() || this.isScreen()) {
      this.handEdge.set('');
      return;
    }
    const el = this.stageRef()?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pin = PIN_DEFS[place];
    const fit = Math.min(rect.width / 1024, rect.height / 913) || 1;
    const localX = (rect.width - 1024 * fit) / 2 + pin.cx * fit;
    const localY = (rect.height - 913 * fit) / 2 + pin.cy * fit;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const read = readTransform(this.stageTransform());
    const x = rect.left + cx + (localX - cx) * read.scale + read.x;
    const y = rect.top + cy + (localY - cy) * read.scale + read.y;
    const pad = 64;
    if (x < pad) this.handEdge.set('left');
    else if (x > window.innerWidth - pad) this.handEdge.set('right');
    else if (y < pad) this.handEdge.set('top');
    else if (y > window.innerHeight - pad) this.handEdge.set('bottom');
    else this.handEdge.set('');
  }

  private syncCamera(): void {
    this.releaseLive();
    const place = this.child();
    if (place && place !== 'screen' && place in PIN_DEFS) {
      const next = this.focusOn(place as Exclude<PlaceSlug, 'tv' | 'screen'>);
      const read = readTransform(next);
      this.panX = read.x;
      this.panY = read.y;
      this.scale = Math.max(1, read.scale);
      this.stageTransform.set(next);
      return;
    }
    if (!this.isScreen()) this.home();
  }

  private focusOn(place: Exclude<PlaceSlug, 'tv' | 'screen'>): string {
    const el = this.stageRef()?.nativeElement;
    return travelTransform(place, {
      width: el?.offsetWidth ?? 1000,
      height: el?.offsetHeight ?? 700,
    });
  }

  private baseTransform(): string {
    return `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`;
  }
}

const MAX_SCALE = 2.4;
const GLIDE_MS = 700;

function readTransform(value: string): { x: number; y: number; scale: number } {
  const move = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(value);
  const zoom = /scale\(([-\d.]+)\)/.exec(value);
  return {
    x: move ? Number(move[1]) : 0,
    y: move ? Number(move[2]) : 0,
    scale: zoom ? Number(zoom[1]) : 1,
  };
}

function childOf(url: string): string {
  const parts = url.split('?')[0].split('#')[0].split('/').filter(Boolean);
  // map / CODE / child
  return parts[2] ?? '';
}

/** A smooth snake through the stops, in visit order. */
function snakePath(stops: { cx: number; cy: number }[]): string {
  const points = stops.map((pin) => ({ x: pin.cx, y: pin.cy }));
  const padded = [points[0], ...points, points[points.length - 1]];
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < padded.length - 2; i++) {
    const p0 = padded[i - 1];
    const p1 = padded[i];
    const p2 = padded[i + 1];
    const p3 = padded[i + 2];
    const c1x = p1.x + (p2.x - p0.x) / 5;
    const c1y = p1.y + (p2.y - p0.y) / 5;
    const c2x = p2.x - (p3.x - p1.x) / 5;
    const c2y = p2.y - (p3.y - p1.y) / 5;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x} ${p2.y}`;
  }
  return d;
}
