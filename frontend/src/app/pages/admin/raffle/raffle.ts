import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Icon } from '../../../shared/icon/icon';

@Component({
  selector: 'app-raffle',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <h1 class="page-title">Sorteio</h1>
      <section class="card soon">
        <app-icon name="gift" [size]="48" [stroke]="1.4" />
        <h2>Em breve</h2>
        <p class="muted">
          O sorteio de prêmios faz parte da próxima fase. Antes, a empresa precisa definir quem
          participa, quais itens entram e como o resultado será registrado.
        </p>
      </section>
    </div>
  `,
  styles: `
    .soon {
      align-items: center;
      text-align: center;
      padding: 48px 24px;
    }

    .soon app-icon {
      color: var(--sky);
    }

    .soon p {
      max-width: 520px;
      margin: 0;
    }
  `,
})
export class Raffle {}
