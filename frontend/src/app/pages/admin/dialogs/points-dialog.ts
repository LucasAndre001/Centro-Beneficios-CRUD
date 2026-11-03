import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { AdminApi } from '../../../api/admin-api.service';
import { errorMessage } from '../../../core/api-error';
import { DialogService } from '../../../core/dialog.service';
import { Employee } from '../../../core/models';
import { Modal } from '../../../shared/modal/modal';

type Kind = 'credit' | 'debit';

@Component({
  selector: 'app-points-dialog',
  imports: [Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './points-dialog.html',
  styleUrl: './dialogs.css',
})
export class PointsDialog implements OnInit {
  private readonly api = inject(AdminApi);
  private readonly dialogs = inject(DialogService);

  readonly employeeId = input<number | null>(null);
  readonly closed = output<void>();
  readonly saved = output<void>();

  protected readonly presets = [10, 20, 50, 100];
  protected readonly employees = signal<Employee[]>([]);
  protected readonly selected = signal<number[]>([]);
  protected readonly kind = signal<Kind>('credit');
  protected readonly amount = signal(20);
  protected readonly reason = signal('');
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal('');

  protected readonly summary = computed(() => {
    const count = this.selected().length;
    if (count === 0) {
      return 'Selecione ao menos um funcionário';
    }
    const verb = this.kind() === 'credit' ? 'Creditar' : 'Debitar';
    return `${verb} ${this.amount()} pts para ${count} ${count === 1 ? 'funcionário' : 'funcionários'}`;
  });

  protected readonly canSave = computed(
    () => this.selected().length > 0 && this.amount() > 0 && this.reason().trim().length > 0,
  );

  ngOnInit(): void {
    const preselected = this.employeeId();
    if (preselected !== null) {
      this.selected.set([preselected]);
    }

    this.api.employees().subscribe({
      next: (employees) => {
        this.employees.set(employees);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(errorMessage(error));
        this.loading.set(false);
      },
    });
  }

  protected isSelected(id: number): boolean {
    return this.selected().includes(id);
  }

  protected toggle(id: number): void {
    this.selected.update((ids) =>
      ids.includes(id) ? ids.filter((current) => current !== id) : [...ids, id],
    );
  }

  protected selectAll(): void {
    this.selected.set(this.employees().map((employee) => employee.id));
  }

  protected setAmount(value: number): void {
    this.amount.set(Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0);
  }

  protected save(): void {
    if (!this.canSave()) {
      this.error.set('Escolha os funcionários, a quantidade e o motivo.');
      return;
    }

    const signedAmount = this.kind() === 'credit' ? this.amount() : -this.amount();
    const reason = this.reason().trim();

    this.saving.set(true);
    this.error.set('');
    this.api.adjustPointsBatch(signedAmount, reason, this.selected()).subscribe({
      next: (result) => {
        this.saving.set(false);
        const verb = signedAmount > 0 ? 'creditados' : 'debitados';
        this.dialogs.success(
          'Pontos alterados',
          `${this.amount()} pts ${verb} para ${result.changed} ${result.changed === 1 ? 'funcionário' : 'funcionários'}.`,
          `Motivo: ${reason}`,
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
}
