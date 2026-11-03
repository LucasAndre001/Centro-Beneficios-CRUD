import { Injectable, signal } from '@angular/core';

export type NoticeTone = 'success' | 'error' | 'info';

export interface Notice {
  title: string;
  lines: string[];
  tone: NoticeTone;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  details?: { label: string; value: string }[];
  confirmLabel: string;
  danger?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class DialogService {
  readonly notice = signal<Notice | null>(null);
  readonly pendingConfirm = signal<PendingConfirm | null>(null);

  success(title: string, ...lines: string[]): void {
    this.notice.set({ title, lines, tone: 'success' });
  }

  error(title: string, ...lines: string[]): void {
    this.notice.set({ title, lines, tone: 'error' });
  }

  info(title: string, ...lines: string[]): void {
    this.notice.set({ title, lines, tone: 'info' });
  }

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => this.pendingConfirm.set({ ...options, resolve }));
  }

  closeNotice(): void {
    this.notice.set(null);
  }

  answer(confirmed: boolean): void {
    this.pendingConfirm()?.resolve(confirmed);
    this.pendingConfirm.set(null);
  }
}
