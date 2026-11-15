import { Component } from '@angular/core';

@Component({
  selector: 'mq-parchment',
  template: `
    <div class="mq-frame h-full">
      <i class="mq-stud tl" aria-hidden="true"></i>
      <i class="mq-stud tr" aria-hidden="true"></i>
      <i class="mq-stud bl" aria-hidden="true"></i>
      <i class="mq-stud br" aria-hidden="true"></i>
      <div class="mq-paper h-full">
        <ng-content />
      </div>
    </div>
  `,
})
export class ParchmentFrame {}
