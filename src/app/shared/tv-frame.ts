import { Component, computed, input } from '@angular/core';
import type { Story } from '../core/models';

@Component({
  selector: 'mq-tv',
  template: `
    <div class="rounded-[28px] border-[10px] border-[#2a1a10] bg-[#1a120c] p-2 shadow-xl">
      <div class="relative aspect-video overflow-hidden rounded-md bg-black">
        @if (story(); as s) {
          <div class="flex h-full flex-col justify-end bg-gradient-to-b from-[#2f6f8f] to-[#1f3b4a] p-3 text-[#fff8e4]">
            <p class="text-[10px] uppercase tracking-[0.2em] opacity-80">Island bulletin</p>
            <p class="text-lg font-bold leading-tight">{{ s.title }}</p>
            <p class="mt-1 line-clamp-3 text-sm">{{ s.body }}</p>
          </div>
        } @else {
          <div class="snow h-full w-full"></div>
          <p class="absolute inset-0 flex items-center justify-center text-sm text-white/80">
            No approved news — the desk is asleep.
          </p>
        }
      </div>
      <div class="mt-2 flex items-center justify-between px-2 text-[#e8c547]">
        <span class="text-xs tracking-widest">MQ-TV</span>
        <span class="h-3 w-3 rounded-full bg-red-600 shadow"></span>
      </div>
    </div>
  `,
})
export class TvFrame {
  readonly stories = input<Story[]>([]);
  readonly tick = input(0);
  readonly story = computed(() => {
    const list = this.stories();
    if (!list.length) return null;
    const i = Math.floor(this.tick() / 15) % list.length;
    return list[i];
  });
}
