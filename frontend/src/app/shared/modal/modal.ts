import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { Icon } from '../icon/icon';

let nextId = 0;

@Component({
  selector: 'app-modal',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './modal.html',
  styleUrl: './modal.css',
  host: {
    '(document:keydown.escape)': 'close()',
    '[class.is-drawer]': "size() === 'drawer'",
    '[class.is-centered]': 'centered()',
  },
})
export class Modal {
  readonly heading = input.required<string>();
  readonly size = input<'sm' | 'md' | 'lg' | 'xl' | 'drawer'>('md');
  readonly subtitle = input('');
  readonly closable = input(true);
  readonly centered = input(false);
  readonly closed = output<void>();

  protected readonly titleId = `modal-title-${nextId++}`;
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');

  constructor() {
    afterNextRender(() => this.panel().nativeElement.focus());
  }

  close(): void {
    if (this.closable()) {
      this.closed.emit();
    }
  }
}
