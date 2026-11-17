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
import { daysAgoIso, toIsoDate } from '../../../core/dates';
import { readLastSeen, redemptionsSeenKey, saveLastSeen } from '../../../core/last-seen';
import { AdminRedemption } from '../../../core/models';
import { initialsOf } from '../../../core/text';
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
  private readonly lastSeenKey = redemptionsSeenKey(inject(AuthService).user()?.id);
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

  private readonly dayFormat = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  protected readonly groups = computed(() => {
    const today = toIsoDate(new Date());
    const yesterday = daysAgoIso(1);
    const groups: { key: string; label: string; items: AdminRedemption[] }[] = [];

    for (const item of this.visible()) {
      const date = new Date(item.createdAt);
      const key = toIsoDate(date);
      let group = groups.at(-1);
      if (group?.key !== key) {
        const label =
          key === today ? 'Hoje' : key === yesterday ? 'Ontem' : capitalize(this.dayFormat.format(date));
        group = { key, label, items: [] };
        groups.push(group);
      }
      group.items.push(item);
    }
    return groups;
  });

  constructor() {
    effect(() => this.load(this.range()));
  }

  protected isNew(item: AdminRedemption): boolean {
    return this.lastSeen !== null && new Date(item.createdAt).getTime() > this.lastSeen;
  }

  protected initials(name: string): string {
    return initialsOf(name);
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

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
