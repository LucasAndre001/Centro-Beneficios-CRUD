import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AdminApi } from '../../../api/admin-api.service';
import { errorMessage } from '../../../core/api-error';
import { isoToBr, todayIso } from '../../../core/dates';
import { DialogService } from '../../../core/dialog.service';
import { Employee } from '../../../core/models';
import { Modal } from '../../../shared/modal/modal';

@Component({
  selector: 'app-employee-form-dialog',
  imports: [Modal, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employee-form-dialog.html',
  styleUrl: '../dialogs/dialogs.css',
})
export class EmployeeFormDialog implements OnInit {
  private readonly api = inject(AdminApi);
  private readonly dialogs = inject(DialogService);

  readonly employee = input<Employee | null>(null);
  readonly closed = output<void>();
  readonly saved = output<void>();

  protected readonly today = todayIso();
  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.minLength(6)],
    points: [0, [Validators.required, Validators.min(0)]],
    reason: [''],
    attendanceDate: [this.today],
    attendance: [0, Validators.min(0)],
  });

  protected readonly saving = signal(false);
  protected readonly error = signal('');
  private originalAttendance = 0;

  ngOnInit(): void {
    const employee = this.employee();

    if (!employee) {
      this.form.controls.password.addValidators(Validators.required);
      return;
    }

    this.form.patchValue({
      name: employee.name,
      email: employee.email,
      points: employee.pointsBalance,
    });
    this.loadAttendance();
  }

  protected loadAttendance(): void {
    const employee = this.employee();
    const date = this.form.controls.attendanceDate.value;
    if (!employee || !date) {
      return;
    }

    this.api.attendanceOf(employee.id, date).subscribe({
      next: (day) => {
        this.originalAttendance = day.total;
        this.form.controls.attendance.setValue(day.total);
      },
    });
  }

  protected pointsChanged(): boolean {
    const employee = this.employee();
    return employee !== null && this.form.controls.points.value !== employee.pointsBalance;
  }

  protected async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Confira os campos: nome, e-mail válido e senha com pelo menos 6 caracteres.');
      return;
    }

    if (this.pointsChanged() && !this.form.controls.reason.value.trim()) {
      this.error.set('Informe o motivo da alteração de fundos.');
      return;
    }

    this.saving.set(true);
    this.error.set('');

    try {
      const employee = this.employee();
      if (employee) {
        await this.update(employee);
      } else {
        await this.create();
      }
      this.saved.emit();
      this.closed.emit();
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  private async create(): Promise<void> {
    const value = this.form.getRawValue();
    const created = await firstValueFrom(
      this.api.createEmployee({
        name: value.name.trim(),
        email: value.email.trim(),
        password: value.password,
        initialPoints: value.points,
      }),
    );
    this.dialogs.success(
      'Funcionário criado',
      `${created.name} (${created.email}) foi cadastrado.`,
    );
  }

  private async update(employee: Employee): Promise<void> {
    const value = this.form.getRawValue();
    const changes: { title: string; line: string }[] = [];

    const dataChanged =
      value.name.trim() !== employee.name ||
      value.email.trim() !== employee.email ||
      !!value.password;

    if (dataChanged) {
      await firstValueFrom(
        this.api.updateEmployee(employee.id, {
          name: value.name.trim(),
          email: value.email.trim(),
          password: value.password || null,
        }),
      );
      changes.push({ title: 'Funcionário alterado', line: 'Dados do funcionário atualizados.' });
    }

    if (this.pointsChanged()) {
      const reason = value.reason.trim();
      await firstValueFrom(
        this.api.adjustPoints(employee.id, value.points - employee.pointsBalance, reason),
      );
      changes.push({
        title: 'Pontos alterados',
        line: `Fundos: ${employee.pointsBalance} → ${value.points} pts (motivo: ${reason}).`,
      });
    }

    if (value.attendance !== this.originalAttendance) {
      await firstValueFrom(
        this.api.setAttendance(employee.id, value.attendanceDate, value.attendance),
      );
      changes.push({
        title: 'Atendimentos alterados',
        line: `Atendimentos de ${isoToBr(value.attendanceDate)}: ${this.originalAttendance} → ${value.attendance}.`,
      });
    }

    if (changes.length === 0) {
      this.dialogs.info('Nada foi alterado', 'Nenhuma informação foi modificada.');
      return;
    }

    const title = changes.length === 1 ? changes[0].title : 'Funcionário alterado';
    this.dialogs.success(title, ...changes.map((change) => change.line));
  }
}
