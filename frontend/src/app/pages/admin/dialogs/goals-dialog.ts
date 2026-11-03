import { ChangeDetectionStrategy, Component, inject, OnInit, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminApi } from '../../../api/admin-api.service';
import { errorMessage } from '../../../core/api-error';
import { DialogService } from '../../../core/dialog.service';
import { Goals } from '../../../core/models';
import { Modal } from '../../../shared/modal/modal';

@Component({
  selector: 'app-goals-dialog',
  imports: [Modal, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './goals-dialog.html',
  styleUrl: './dialogs.css',
})
export class GoalsDialog implements OnInit {
  private readonly api = inject(AdminApi);
  private readonly dialogs = inject(DialogService);

  readonly closed = output<void>();
  readonly saved = output<void>();

  protected readonly form = inject(NonNullableFormBuilder).group({
    day: [null as number | null, Validators.min(1)],
    week: [null as number | null, Validators.min(1)],
    month: [null as number | null, Validators.min(1)],
  });

  protected readonly saving = signal(false);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.api.goals().subscribe({
      next: (goals) => this.form.setValue(goals),
      error: (error) => this.error.set(errorMessage(error)),
    });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.error.set('As metas precisam ser maiores que zero.');
      return;
    }

    this.submit(this.normalized());
  }

  protected async removeAll(): Promise<void> {
    const confirmed = await this.dialogs.confirm({
      title: 'Remover todas as metas?',
      message: 'Dia, semana e mês ficarão sem meta até você definir novas.',
      confirmLabel: 'Remover metas',
      danger: true,
    });

    if (confirmed) {
      this.submit({ day: null, week: null, month: null });
    }
  }

  private submit(goals: Goals): void {
    this.saving.set(true);
    this.error.set('');
    this.api.updateGoals(goals).subscribe({
      next: (result) => {
        this.saving.set(false);
        this.notify(result);
        this.saved.emit();
        this.closed.emit();
      },
      error: (error) => {
        this.saving.set(false);
        this.error.set(errorMessage(error));
      },
    });
  }

  private notify(goals: Goals): void {
    if (goals.day === null && goals.week === null && goals.month === null) {
      this.dialogs.success('Metas removidas', 'Nenhum período tem meta no momento.');
      return;
    }

    const describe = (label: string, value: number | null) =>
      `${label}: ${value === null ? 'sem meta' : `${value} atendimentos por funcionário`}`;
    this.dialogs.success(
      'Metas atualizadas',
      describe('Dia', goals.day),
      describe('Semana', goals.week),
      describe('Mês', goals.month),
    );
  }

  private normalized(): Goals {
    const value = this.form.getRawValue();
    const clean = (goal: number | null) => (goal ? Math.floor(goal) : null);
    return { day: clean(value.day), week: clean(value.week), month: clean(value.month) };
  }
}
