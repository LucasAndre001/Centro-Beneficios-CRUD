import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { AdminApi } from '../../../api/admin-api.service';
import { errorMessage } from '../../../core/api-error';
import { isoToBr, todayIso } from '../../../core/dates';
import { DialogService } from '../../../core/dialog.service';
import { Modal } from '../../../shared/modal/modal';

interface Row {
  employeeId: number;
  name: string;
  original: number;
  value: number;
}

@Component({
  selector: 'app-attendance-dialog',
  imports: [Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './attendance-dialog.html',
  styleUrl: './dialogs.css',
})
export class AttendanceDialog {
  private readonly api = inject(AdminApi);
  private readonly dialogs = inject(DialogService);

  readonly employeeId = input<number | null>(null);
  readonly closed = output<void>();
  readonly saved = output<void>();

  protected readonly today = todayIso();
  protected readonly date = signal(this.today);
  protected readonly rows = signal<Row[]>([]);
  protected readonly search = signal('');
  protected readonly note = signal('');
  protected readonly showAll = signal(false);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal('');

  protected readonly visibleRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const onlyId = this.showAll() ? null : this.employeeId();
    return this.rows().filter(
      (row) =>
        (onlyId === null || row.employeeId === onlyId) && row.name.toLowerCase().includes(term),
    );
  });

  protected readonly changedCount = computed(
    () => this.rows().filter((row) => row.value !== row.original).length,
  );

  constructor() {
    effect(() => this.load(this.date()));
  }

  protected change(employeeId: number, value: number): void {
    const safeValue = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    this.rows.update((rows) =>
      rows.map((row) => (row.employeeId === employeeId ? { ...row, value: safeValue } : row)),
    );
  }

  protected save(): void {
    const items = this.rows()
      .filter((row) => row.value !== row.original)
      .map((row) => ({ employeeId: row.employeeId, quantity: row.value }));

    if (items.length === 0) {
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.api.saveAttendanceBatch(this.date(), this.note().trim(), items).subscribe({
      next: (result) => {
        this.saving.set(false);
        this.dialogs.success(
          'Atendimentos alterados',
          `${result.changed} ${result.changed === 1 ? 'funcionário atualizado' : 'funcionários atualizados'} em ${isoToBr(this.date())}.`,
        );
        this.saved.emit();
        this.closed.emit();
      },
      error: (error) => {
        this.saving.set(false);
        this.error.set(errorMessage(error));
      },
    });
  }

  private load(date: string): void {
    this.loading.set(true);
    this.api.attendanceForDay(date).subscribe({
      next: (rows) => {
        this.rows.set(
          rows.map((row) => ({
            employeeId: row.employeeId,
            name: row.name,
            original: row.total,
            value: row.total,
          })),
        );
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(errorMessage(error));
        this.loading.set(false);
      },
    });
  }
}
