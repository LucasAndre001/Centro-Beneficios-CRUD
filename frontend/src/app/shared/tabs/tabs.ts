import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface TabOption<T> {
  value: T;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './tabs.css',
  template: `
    <div role="tablist" [attr.aria-label]="label()" [class]="'tabs ' + variant()">
      @for (option of options(); track option.value) {
        <button
          type="button"
          role="tab"
          class="tab"
          [class.active]="option.value === value()"
          [attr.aria-selected]="option.value === value()"
          [disabled]="option.disabled"
          (click)="value.set(option.value)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
})
export class Tabs<T> {
  readonly options = input.required<TabOption<T>[]>();
  readonly label = input.required<string>();
  readonly variant = input<'underline' | 'pill' | 'boxed'>('underline');
  readonly value = model.required<T>();
}
