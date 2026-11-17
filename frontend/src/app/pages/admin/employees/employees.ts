import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AdminApi } from '../../../api/admin-api.service';
import { errorMessage } from '../../../core/api-error';
import { DialogService } from '../../../core/dialog.service';
import { AttendanceRankingItem, Employee } from '../../../core/models';
import { initialsOf } from '../../../core/text';
import { Icon } from '../../../shared/icon/icon';
import { ProgressBar } from '../../../shared/progress-bar/progress-bar';
import { EmployeeFormDialog } from './employee-form-dialog';

@Component({
  selector: 'app-employees',
  imports: [Icon, ProgressBar, EmployeeFormDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employees.html',
  styleUrl: './employees.css',
})
export class Employees implements OnInit {
  private readonly api = inject(AdminApi);
  private readonly dialogs = inject(DialogService);
  private readonly router = inject(Router);

  readonly novo = input<string>();

  protected readonly employees = signal<Employee[] | null>(null);
  protected readonly monthly = signal(new Map<number, AttendanceRankingItem>());
  protected readonly search = signal('');
  protected readonly showInactive = signal(false);
  protected readonly error = signal('');
  protected readonly editing = signal<Employee | null | undefined>(undefined);

  protected readonly visible = computed(() => {
    const term = this.search().trim().toLowerCase();
    return (this.employees() ?? []).filter(
      (employee) =>
        employee.isActive !== this.showInactive() &&
        (employee.name.toLowerCase().includes(term) || employee.email.toLowerCase().includes(term)),
    );
  });

  protected readonly counts = computed(() => {
    const list = this.employees() ?? [];
    const active = list.filter((employee) => employee.isActive).length;
    return { active, inactive: list.length - active };
  });

  ngOnInit(): void {
    this.load();

    if (this.novo()) {
      this.editing.set(null);
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
    }
  }

  protected load(): void {
    this.error.set('');
    forkJoin({
      employees: this.api.employees('', true),
      dashboard: this.api.dashboard('Month'),
    }).subscribe({
      next: ({ employees, dashboard }) => {
        this.employees.set(employees);
        this.monthly.set(new Map(dashboard.attendanceRanking.map((row) => [row.employeeId, row])));
      },
      error: (error) => this.error.set(errorMessage(error)),
    });
  }

  protected initials(name: string): string {
    return initialsOf(name);
  }

  protected async deactivate(employee: Employee): Promise<void> {
    const confirmed = await this.dialogs.confirm({
      title: 'Desativar funcionário?',
      message: `${employee.name} não poderá mais entrar no sistema. O histórico de pontos, atendimentos e resgates é mantido.`,
      confirmLabel: 'Desativar',
      danger: true,
    });

    if (confirmed) {
      this.changeStatus(employee, false);
    }
  }

  protected async reactivate(employee: Employee): Promise<void> {
    const confirmed = await this.dialogs.confirm({
      title: 'Reativar funcionário?',
      message: `${employee.name} voltará a acessar o sistema.`,
      confirmLabel: 'Reativar',
    });

    if (confirmed) {
      this.changeStatus(employee, true);
    }
  }

  private changeStatus(employee: Employee, isActive: boolean): void {
    this.api.setEmployeeStatus(employee.id, isActive).subscribe({
      next: () => {
        if (isActive) {
          this.dialogs.success('Funcionário reativado', `${employee.name} pode entrar novamente.`);
        } else {
          this.dialogs.success(
            'Funcionário desativado',
            `${employee.name} foi desativado e não consegue mais entrar.`,
            'O histórico foi mantido.',
          );
        }
        this.load();
      },
      error: (error) => this.dialogs.error('Não foi possível alterar', errorMessage(error)),
    });
  }
}
