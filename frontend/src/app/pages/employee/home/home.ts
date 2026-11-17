import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmployeeApi } from '../../../api/employee-api.service';
import { errorMessage } from '../../../core/api-error';
import { AuthService } from '../../../core/auth.service';
import { BalanceStore } from '../../../core/balance.store';
import { EmployeeDashboard, GoalPeriod, GoalProgress } from '../../../core/models';
import { greeting } from '../../../core/text';
import { GameRankingCard } from '../../../shared/game-ranking-card/game-ranking-card';
import { Icon, IconName } from '../../../shared/icon/icon';
import { ProgressBar } from '../../../shared/progress-bar/progress-bar';
import { TabOption, Tabs } from '../../../shared/tabs/tabs';

type PointsView = 'current' | 'history';

interface Stat {
  label: string;
  value: string;
  icon: IconName;
  note: string;
  good: boolean;
}

const PERIOD_LABELS: Record<GoalPeriod, string> = {
  Day: 'Dia',
  Week: 'Semana',
  Month: 'Mês',
};

@Component({
  selector: 'app-employee-home',
  imports: [DatePipe, RouterLink, Tabs, ProgressBar, Icon, GameRankingCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class EmployeeHome implements OnInit {
  private readonly api = inject(EmployeeApi);
  private readonly balanceStore = inject(BalanceStore);
  protected readonly user = inject(AuthService).user;
  protected readonly affordable = this.balanceStore.affordableCount;

  protected readonly dashboard = signal<EmployeeDashboard | null>(null);
  protected readonly error = signal('');
  protected readonly today = new Date();
  protected readonly greeting = greeting(this.today);

  protected readonly pointsView = signal<PointsView>('current');
  protected readonly pointsTabs: TabOption<PointsView>[] = [
    { value: 'current', label: 'Atual' },
    { value: 'history', label: 'Histórico' },
  ];

  private readonly goalOf = computed(() => {
    const goals = this.dashboard()?.goals ?? [];
    return (period: GoalPeriod) => goals.find((g) => g.period === period) ?? null;
  });

  protected readonly stats = computed<Stat[]>(() => {
    const data = this.dashboard();
    if (!data) {
      return [];
    }

    const goal = this.goalOf();
    return [
      { ...attendanceStat('Atendimentos hoje', goal('Day'), 'do dia'), icon: 'headset' },
      { ...attendanceStat('Na semana', goal('Week'), 'da semana'), icon: 'target' },
      { ...attendanceStat('No mês', goal('Month'), 'do mês'), icon: 'trophy' },
      {
        label: 'Saldo',
        value: `${data.pointsBalance} pts`,
        icon: 'coin',
        note: 'disponíveis para resgate',
        good: false,
      },
    ];
  });

  protected readonly weekHint = computed(() => {
    const week = this.goalOf()('Week');
    if (!week?.target) {
      return '';
    }
    const missing = week.target - week.total;
    if (missing <= 0) {
      return 'meta da semana batida!';
    }
    return `${missing === 1 ? 'falta 1 atendimento' : `faltam ${missing} atendimentos`} para a meta da semana`;
  });

  protected readonly goals = computed(() =>
    (this.dashboard()?.goals ?? [])
      .filter((goal) => goal.target !== null)
      .map((goal) => ({
        ...goal,
        label: PERIOD_LABELS[goal.period],
        done: (goal.percent ?? 0) >= 100,
        missing: Math.max(0, (goal.target ?? 0) - goal.total),
      })),
  );

  protected readonly lastTransaction = computed(
    () => this.dashboard()?.recentTransactions[0] ?? null,
  );

  private readonly images = computed(
    () => new Map((this.balanceStore.catalog() ?? []).map((p) => [p.id, p.imageDataUrl])),
  );

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.error.set('');
    this.api.dashboard().subscribe({
      next: (dashboard) => {
        this.dashboard.set(dashboard);
        this.balanceStore.set(dashboard.pointsBalance);
      },
      error: (error) => this.error.set(errorMessage(error)),
    });
  }

  protected imageOf(productId: number): string | null {
    return this.images().get(productId) ?? null;
  }
}

function attendanceStat(
  label: string,
  goal: GoalProgress | null,
  periodName: string,
): Omit<Stat, 'icon'> {
  const total = goal?.total ?? 0;
  if (!goal?.target) {
    return { label, value: String(total), note: '', good: false };
  }

  const percent = goal.percent ?? 0;
  if (percent >= 100) {
    return { label, value: String(total), note: `meta ${periodName} batida`, good: true };
  }
  return { label, value: String(total), note: `de ${goal.target} · ${percent}%`, good: false };
}
