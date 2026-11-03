import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { AdminApi } from '../../../api/admin-api.service';
import { errorMessage } from '../../../core/api-error';
import { AuthService } from '../../../core/auth.service';
import { daysAgoIso } from '../../../core/dates';
import { AdminRedemption } from '../../../core/models';
import { Icon } from '../../../shared/icon/icon';
import { TabOption, Tabs } from '../../../shared/tabs/tabs';

type Range = 'today' | 'week' | 'month' | 'all';

const RANGE_DAYS: Record<Range, number | null> = {
  today: 0,
  week: 6,
  month: 29,
  all: null,
};

@Component({
  selector: 'app-redemptions',
  imports: [DatePipe, Icon, Tabs],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './redemptions.html',
  styleUrl: './redemptions.css',
})
export class Redemptions {
  private readonly api = inject(AdminApi);
  private readonly lastSeenKey = `cb.redemptions.lastSeen.${inject(AuthService).user()?.id}`;
  private readonly lastSeen = readLastSeen(this.lastSeenKey);

  protected readonly range = signal<Range>('week');
  protected readonly rangeTabs: TabOption<Range>[] = [
    { value: 'today', label: 'Hoje' },
    { value: 'week', label: '7 dias' },
    { value: 'month', label: '30 dias' },
    { value: 'all', label: 'Tudo' },
  ];

  protected readonly search = signal('');
  protected readonly redemptions = signal<AdminRedemption[] | null>(null);
  protected readonly error = signal('');

  protected readonly visible = computed(() => {
    const term = this.search().trim().toLowerCase();
    return (this.redemptions() ?? []).filter(
      (item) =>
        item.employeeName.toLowerCase().includes(term) ||
        item.productName.toLowerCase().includes(term),
    );
  });

  protected readonly totals = computed(() => ({
    count: this.visible().reduce((sum, item) => sum + item.quantity, 0),
    points: this.visible().reduce((sum, item) => sum + item.totalCostPoints, 0),
    fresh: this.visible().filter((item) => this.isNew(item)).length,
  }));

  constructor() {
    effect(() => this.load(this.range()));
  }

  protected isNew(item: AdminRedemption): boolean {
    return this.lastSeen !== null && new Date(item.createdAt).getTime() > this.lastSeen;
  }

  protected reload(): void {
    this.load(this.range());
  }

  private load(range: Range): void {
    const daysBack = RANGE_DAYS[range];
    this.error.set('');
    this.redemptions.set(null);
    this.api.redemptions('', daysBack === null ? null : daysAgoIso(daysBack)).subscribe({
      next: (items) => {
        this.redemptions.set(items);
        saveLastSeen(this.lastSeenKey);
      },
      error: (error) => this.error.set(errorMessage(error)),
    });
  }
}

function readLastSeen(key: string): number | null {
  try {
    const value = localStorage.getItem(key);
    return value ? Number(value) : null;
  } catch {
    return null;
  }
}

function saveLastSeen(key: string): void {
  try {
    localStorage.setItem(key, String(Date.now()));
  } catch {
    // Sem armazenamento local, apenas não marca os resgates como novos na próxima visita
  }
}
