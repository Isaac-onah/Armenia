import { Component, inject, output } from '@angular/core';
import { RoomService } from '../core/room.service';

@Component({
  selector: 'mq-trust',
  template: `
    <button class="mq-chip" type="button" (click)="open.emit()">Trust {{ meTrust() }}</button>
  `,
})
export class TrustMeter {
  private readonly room = inject(RoomService);
  readonly open = output<void>();
  meTrust(): number {
    return this.room.me()?.trust ?? 0;
  }
}
