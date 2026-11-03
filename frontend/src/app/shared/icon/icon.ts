import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'menu'
  | 'home'
  | 'shop'
  | 'game'
  | 'users'
  | 'box'
  | 'gift'
  | 'headset'
  | 'coin'
  | 'coin-plus'
  | 'target'
  | 'plus'
  | 'edit'
  | 'trash'
  | 'restore'
  | 'search'
  | 'close'
  | 'check'
  | 'lock'
  | 'eye'
  | 'eye-off'
  | 'image'
  | 'user-plus'
  | 'trophy'
  | 'receipt';

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: inline-flex; line-height: 0' },
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="stroke()"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @switch (name()) {
        @case ('menu') {
          <path d="M4 7h16M4 12h16M4 17h16" />
        }
        @case ('home') {
          <path d="M3 11l9-7 9 7" />
          <path d="M5 10v10h14V10" />
        }
        @case ('shop') {
          <path d="M5 8h14l-1 12H6L5 8z" />
          <path d="M9 8V6a3 3 0 016 0v2" />
        }
        @case ('game') {
          <rect x="2" y="7" width="20" height="11" rx="5" />
          <path d="M7 11v3M5.5 12.5h3" />
          <circle cx="16" cy="11.5" r="1" />
          <circle cx="18" cy="14" r="1" />
        }
        @case ('users') {
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" />
          <path d="M16 4.6a3.5 3.5 0 010 6.8M18 14.8c1.9.7 3.1 2.5 3.5 5.2" />
        }
        @case ('user-plus') {
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" />
          <path d="M19 8v6M16 11h6" />
        }
        @case ('box') {
          <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
          <path d="M3 7l9 4 9-4M12 11v10" />
        }
        @case ('gift') {
          <rect x="3" y="8" width="18" height="4" />
          <path d="M5 12v9h14v-9M12 8v13" />
          <path d="M12 8c-2-4-6-4-6-1.5S9 8 12 8zm0 0c2-4 6-4 6-1.5S15 8 12 8z" />
        }
        @case ('headset') {
          <path d="M4 14v-2a8 8 0 0116 0v2" />
          <rect x="3" y="14" width="4" height="6" rx="1.5" />
          <rect x="17" y="14" width="4" height="6" rx="1.5" />
        }
        @case ('coin') {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v10M9 9.5h4.5a1.75 1.75 0 010 3.5h-3a1.75 1.75 0 000 3.5H15" />
        }
        @case ('coin-plus') {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8M8 12h8" />
        }
        @case ('target') {
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1" />
        }
        @case ('plus') {
          <path d="M12 5v14M5 12h14" />
        }
        @case ('edit') {
          <path d="M4 20h4L19 9l-4-4L4 16v4z" />
          <path d="M13.5 6.5l4 4" />
        }
        @case ('trash') {
          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
        }
        @case ('restore') {
          <path d="M4 12a8 8 0 108-8 8.5 8.5 0 00-6 2.5L4 8" />
          <path d="M4 4v4h4" />
        }
        @case ('search') {
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4-4" />
        }
        @case ('close') {
          <path d="M6 6l12 12M18 6L6 18" />
        }
        @case ('check') {
          <path d="M5 12l4 4 10-10" />
        }
        @case ('lock') {
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 018 0v4" />
        }
        @case ('eye') {
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        }
        @case ('eye-off') {
          <path d="M3 3l18 18" />
          <path d="M10.6 5.1A10.4 10.4 0 0112 5c6.5 0 10 7 10 7a17 17 0 01-3.2 4.1" />
          <path d="M6.6 6.6A17.6 17.6 0 002 12s3.5 7 10 7a9.7 9.7 0 005.4-1.6" />
          <path d="M9.9 9.9a3 3 0 004.2 4.2" />
        }
        @case ('image') {
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="10" r="1.8" />
          <path d="M21 16l-5-5-9 8" />
        }
        @case ('receipt') {
          <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
          <path d="M9 8h6M9 12h6M9 16h3" />
        }
        @case ('trophy') {
          <path d="M8 4h8v5a4 4 0 01-8 0V4z" />
          <path d="M8 6H4a4 4 0 004 4M16 6h4a4 4 0 01-4 4M12 13v4M8 20h8M9 17h6" />
        }
      }
    </svg>
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(22);
  readonly stroke = input(1.7);
}
