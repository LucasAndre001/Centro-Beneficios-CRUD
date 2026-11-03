import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="track"
      role="progressbar"
      [attr.aria-label]="label()"
      [attr.aria-valuenow]="percent()"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div class="fill" [class.done]="percent() >= 100" [style.width.%]="width()"></div>
    </div>
  `,
  styles: `
    .track {
      height: var(--bar-height, 14px);
      background: var(--grey);
      border-radius: 3px;
      overflow: hidden;
    }

    .fill {
      height: 100%;
      background: var(--fill, var(--navy));
      transition: width 0.4s ease;
    }

    .fill.done {
      background: var(--success);
    }
  `,
})
export class ProgressBar {
  readonly percent = input.required<number>();
  readonly label = input.required<string>();

  protected readonly width = computed(() => Math.max(0, Math.min(this.percent(), 100)));
}
