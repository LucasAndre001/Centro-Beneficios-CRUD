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
import { daysAgoIso, relativeTime } from '../../../core/dates';
import { readLastSeen, redemptionsSeenKey } from '../../../core/last-seen';
import { AdminDashboard, AdminRedemption, GoalPeriod } from '../../../core/models';
import { greeting, initialsOf } from '../../../core/text';
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
  protected readonly greeting = greeting(this.today);
  private readonly lastSeen = readLastSeen(redemptionsSeenKey(this.user()?.id));

  protected readonly period = signal<GoalPeriod>('Month');
  protected readonly periodTabs: TabOption<GoalPeriod>[] = [
    { value: 'Day', label: 'Dia' },
    { value: 'Week', label: 'Semana' },
    { value: 'Month', label: 'Mês' },
  ];

  protected readonly dashboard = signal<AdminDashboard | null>(null);
  private readonly dayDashboard = signal<AdminDashboard | null>(null);
  private readonly monthDashboard = signal<AdminDashboard | null>(null);
  protected readonly recent = signal<AdminRedemption[] | null>(null);
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
      initials: initialsOf(item.name),
      balance: balances.get(item.employeeId) ?? 0,
    }));
  });

  protected readonly daySummary = computed(() => {
    const data = this.dayDashboard();
    if (!data) {
      return null;
    }
    const people = data.attendanceRanking.length;
    return {
      total: data.attendanceRanking.reduce((sum, row) => sum + row.total, 0),
      teamTarget: data.target && people ? data.target * people : null,
    };
  });

  protected readonly month = computed(() => {
    const data = this.monthDashboard();
    if (!data) {
      return null;
    }
    return {
      active: data.attendanceRanking.length,
      points: data.valueRanking.reduce((sum, row) => sum + row.pointsBalance, 0),
      behind: data.target
        ? data.attendanceRanking.filter((row) => (row.percent ?? 0) < 50).length
        : null,
    };
  });

  protected readonly freshCount = computed(
    () => (this.recent() ?? []).filter((item) => this.isNew(item)).length,
  );

  constructor() {
    effect(() => this.load(this.period()));
    this.loadSummary();
  }

  protected reload(): void {
    this.load(this.period());
    this.loadSummary();
  }

  protected isNew(item: AdminRedemption): boolean {
    return this.lastSeen !== null && new Date(item.createdAt).getTime() > this.lastSeen;
  }

  protected when(iso: string): string {
    return relativeTime(iso);
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

  private loadSummary(): void {
    this.api.dashboard('Day').subscribe({ next: (data) => this.dayDashboard.set(data) });
    this.api.dashboard('Month').subscribe({ next: (data) => this.monthDashboard.set(data) });
    this.api.redemptions('', daysAgoIso(29), 50).subscribe({
      next: (items) => this.recent.set(items),
      error: () => this.recent.set([]),
    });
  }
}
