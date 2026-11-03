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
import { EmployeeDashboard, GoalPeriod } from '../../../core/models';
import { GameRankingCard } from '../../../shared/game-ranking-card/game-ranking-card';
import { Icon } from '../../../shared/icon/icon';
import { ProgressBar } from '../../../shared/progress-bar/progress-bar';
import { TabOption, Tabs } from '../../../shared/tabs/tabs';

type PointsView = 'current' | 'history';

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

  protected readonly dashboard = signal<EmployeeDashboard | null>(null);
  protected readonly error = signal('');
  protected readonly today = new Date();

  protected readonly pointsView = signal<PointsView>('current');
  protected readonly pointsTabs: TabOption<PointsView>[] = [
    { value: 'current', label: 'Atual' },
    { value: 'history', label: 'Histórico' },
  ];

  protected readonly totals = computed(() => {
    const goals = this.dashboard()?.goals ?? [];
    const totalOf = (period: GoalPeriod) => goals.find((g) => g.period === period)?.total ?? 0;
    return { day: totalOf('Day'), week: totalOf('Week'), month: totalOf('Month') };
  });

  protected readonly goals = computed(() =>
    (this.dashboard()?.goals ?? [])
      .filter((goal) => goal.target !== null)
      .map((goal) => ({ ...goal, label: PERIOD_LABELS[goal.period] })),
  );

  protected readonly lastTransaction = computed(
    () => this.dashboard()?.recentTransactions[0] ?? null,
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
}
