import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { errorMessage } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { DialogService } from '../../core/dialog.service';
import { ThemeService } from '../../core/theme.service';
import { Icon } from '../../shared/icon/icon';

const SLOW_SERVER_DELAY_MS = 4000;

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly dialogs = inject(DialogService);
  protected readonly theme = inject(ThemeService);

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly benefits = [
    'Acompanhe seus atendimentos do mês',
    'Junte pontos e confira seu extrato',
    'Resgate produtos na loja de benefícios',
    'Jogue e dispute o ranking',
    'Veja o status das campanhas ativas',
  ];

  protected readonly loading = signal(false);
  protected readonly slowServer = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly error = signal('');

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Informe e-mail e senha.');
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set('');
    const slowTimer = setTimeout(() => this.slowServer.set(true), SLOW_SERVER_DELAY_MS);

    this.auth
      .login(email, password)
      .pipe(
        finalize(() => {
          clearTimeout(slowTimer);
          this.loading.set(false);
          this.slowServer.set(false);
        }),
      )
      .subscribe({
        next: () => this.router.navigateByUrl(this.auth.homePath()),
        error: (error) => this.error.set(errorMessage(error)),
      });
  }

  protected forgotPassword(): void {
    this.dialogs.info('Esqueci minha senha', 'Comunique a supervisão para alterar a sua senha.');
  }
}
