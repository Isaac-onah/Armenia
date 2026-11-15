import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'mq-qr',
  template: `
    <div class="rounded-xl border-2 border-[var(--mq-gold-dark)] bg-[#fff8e4] p-3 text-center">
      <p class="text-xs uppercase tracking-widest mb-1">Scan / share</p>
      <p class="break-all text-sm font-bold">{{ url() }}</p>
      <svg viewBox="0 0 33 33" class="mx-auto mt-2 w-28 h-28" aria-hidden="true">
        @for (cell of cells(); track $index) {
          <rect
            [attr.x]="cell.x"
            [attr.y]="cell.y"
            width="1"
            height="1"
            [attr.fill]="cell.on ? '#4a2c0f' : 'transparent'"
          />
        }
      </svg>
      <p class="text-[10px] opacity-70">Decorative code — type the URL if cameras fail.</p>
    </div>
  `,
})
export class QrPlaque {
  readonly value = input.required<string>();
  readonly url = computed(() => this.value());
  readonly cells = computed(() => {
    const src = this.value();
    const cells: { x: number; y: number; on: boolean }[] = [];
    for (let y = 0; y < 33; y++) {
      for (let x = 0; x < 33; x++) {
        const finder =
          (x < 7 && y < 7) || (x > 25 && y < 7) || (x < 7 && y > 25);
        const hash = hashChar(src, x * 33 + y);
        cells.push({ x, y, on: finder ? finderCell(x, y) : hash % 3 === 0 });
      }
    }
    return cells;
  });
}

function finderCell(x: number, y: number): boolean {
  const fx = x > 25 ? x - 26 : x;
  const fy = y > 25 ? y - 26 : y;
  const edge = fx === 0 || fy === 0 || fx === 6 || fy === 6;
  const core = fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4;
  return edge || core;
}

function hashChar(src: string, i: number): number {
  const c = src.charCodeAt(i % Math.max(src.length, 1)) || 7;
  return (c * 33 + i * 17) % 97;
}
