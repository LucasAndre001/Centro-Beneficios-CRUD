import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminApi } from '../../../api/admin-api.service';
import { errorMessage } from '../../../core/api-error';
import { AuthService } from '../../../core/auth.service';
import { AdminDashboard, GoalPeriod } from '../../../core/models';
import { GameRankingCard } from '../../../shared/game-ranking-card/game-ranking-card';
import { Icon } from '../../../shared/icon/icon';
import { ProgressBar } from '../../../shared/progress-bar/progress-bar';
import { TabOption, Tabs } from '../../../shared/tabs/tabs';
import { AttendanceDialog } from '../dialogs/attendance-dialog';
import { GoalsDialog } from '../dialogs/goals-dialog';
import { PointsDialog } from '../dialogs/points-dialog';

type OpenDialog =
  | { type: 'attendance'; employeeId: number | null }
  | { type: 'points'; employeeId: number | null }
  | { type: 'goals' };

const GOAL_LABELS: Record<GoalPeriod, string> = {
  Day: 'do dia',
  Week: 'da semana',
  Month: 'do mês',
};

@Component({
  selector: 'app-admin-home',
  imports: [
    DatePipe,
    RouterLink,
    Tabs,
    Icon,
    ProgressBar,
    GameRankingCard,
    AttendanceDialog,
    PointsDialog,
    GoalsDialog,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class AdminHome {
  private readonly api = inject(AdminApi);
  protected readonly user = inject(AuthService).user;
  protected readonly today = new Date();

  protected readonly period = signal<GoalPeriod>('Month');
  protected readonly periodTabs: TabOption<GoalPeriod>[] = [
    { value: 'Day', label: 'Dia' },
    { value: 'Week', label: 'Semana' },
    { value: 'Month', label: 'Mês' },
  ];

  protected readonly dashboard = signal<AdminDashboard | null>(null);
  protected readonly error = signal('');
  protected readonly dialog = signal<OpenDialog | null>(null);
  protected readonly dialogEmployeeId = computed(() => {
    const open = this.dialog();
    return open && 'employeeId' in open ? open.employeeId : null;
  });

  protected readonly goalText = computed(() => {
    const target = this.dashboard()?.target;
    const label = GOAL_LABELS[this.period()];
    return target ? `Meta ${label}: ${target} atendimentos por funcionário` : `Sem meta ${label}`;
  });

  protected readonly rows = computed(() => {
    const data = this.dashboard();
    if (!data) {
      return [];
    }

    const balances = new Map(
      data.valueRanking.map((item) => [item.employeeId, item.pointsBalance]),
    );
    return data.attendanceRanking.map((item) => ({
      ...item,
      balance: balances.get(item.employeeId) ?? 0,
    }));
  });

  constructor() {
    effect(() => this.load(this.period()));
  }

  protected reload(): void {
    this.load(this.period());
  }

  protected openAttendance(employeeId: number | null = null): void {
    this.dialog.set({ type: 'attendance', employeeId });
  }

  protected openPoints(employeeId: number | null = null): void {
    this.dialog.set({ type: 'points', employeeId });
  }

  protected openGoals(): void {
    this.dialog.set({ type: 'goals' });
  }

  private load(period: GoalPeriod): void {
    this.error.set('');
    this.api.dashboard(period).subscribe({
      next: (dashboard) => this.dashboard.set(dashboard),
      error: (error) => this.error.set(errorMessage(error)),
    });
  }
}
