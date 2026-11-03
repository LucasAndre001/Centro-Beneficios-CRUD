import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { EmployeeApi } from '../../../api/employee-api.service';
import { errorMessage } from '../../../core/api-error';
import { BalanceStore } from '../../../core/balance.store';
import { DialogService } from '../../../core/dialog.service';
import { CatalogProduct } from '../../../core/models';
import { Icon } from '../../../shared/icon/icon';

@Component({
  selector: 'app-shop',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shop.html',
  styleUrl: './shop.css',
})
export class Shop implements OnInit {
  private readonly api = inject(EmployeeApi);
  private readonly dialogs = inject(DialogService);
  private readonly balanceStore = inject(BalanceStore);

  protected readonly balance = this.balanceStore.balance;
  protected readonly products = signal<CatalogProduct[] | null>(null);
  protected readonly error = signal('');
  protected readonly search = signal('');
  protected readonly redeemingId = signal<number | null>(null);

  protected readonly visible = computed(() => {
    const term = this.search().trim().toLowerCase();
    return (this.products() ?? []).filter((p) => p.name.toLowerCase().includes(term));
  });

  ngOnInit(): void {
    this.load();
    this.balanceStore.refresh();
  }

  protected load(): void {
    this.error.set('');
    this.api.catalog().subscribe({
      next: (products) => this.products.set(products),
      error: (error) => this.error.set(errorMessage(error)),
    });
  }

  protected missingPoints(product: CatalogProduct): number {
    return Math.max(0, product.pointCost - (this.balance() ?? 0));
  }

  protected async redeem(product: CatalogProduct): Promise<void> {
    const balance = this.balance() ?? 0;
    const confirmed = await this.dialogs.confirm({
      title: 'Confirmar resgate',
      message: `Deseja resgatar ${product.name}?`,
      details: [
        { label: 'Saldo atual', value: `${balance} pts` },
        { label: 'Custo', value: `− ${product.pointCost} pts` },
        { label: 'Saldo depois', value: `${balance - product.pointCost} pts` },
      ],
      confirmLabel: 'Confirmar resgate',
    });

    if (!confirmed) {
      return;
    }

    this.redeemingId.set(product.id);
    this.api.redeem(product.id).subscribe({
      next: (result) => {
        this.redeemingId.set(null);
        this.balanceStore.set(result.newBalance);
        this.products.update((list) =>
          (list ?? []).map((p) =>
            p.id === product.id ? { ...p, stockQuantity: p.stockQuantity - 1 } : p,
          ),
        );
        this.dialogs.success(
          'Resgate realizado',
          `Você resgatou ${product.name} por ${product.pointCost} pts.`,
          `Seu saldo agora é ${result.newBalance} pts. Procure a supervisão para retirar o produto.`,
        );
      },
      error: (error) => {
        this.redeemingId.set(null);
        this.dialogs.error('Não foi possível resgatar', errorMessage(error));
        this.load();
        this.balanceStore.refresh();
      },
    });
  }
}
