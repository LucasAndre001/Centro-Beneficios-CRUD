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
import { ProgressBar } from '../../../shared/progress-bar/progress-bar';

type Filter = 'all' | 'affordable' | 'soldOut';
type Sort = 'cheap' | 'expensive' | 'name';

const LOW_STOCK = 2;

@Component({
  selector: 'app-shop',
  imports: [Icon, ProgressBar],
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
  protected readonly filter = signal<Filter>('all');
  protected readonly sort = signal<Sort>('cheap');
  protected readonly lowStock = LOW_STOCK;

  private readonly matches = computed(() => {
    const term = this.search().trim().toLowerCase();
    return (this.products() ?? []).filter((p) => p.name.toLowerCase().includes(term));
  });

  protected readonly filters = computed(() => {
    const list = this.matches();
    return [
      { value: 'all' as Filter, label: 'Todos', count: list.length },
      {
        value: 'affordable' as Filter,
        label: 'Posso resgatar',
        count: list.filter((p) => this.canRedeem(p)).length,
      },
      {
        value: 'soldOut' as Filter,
        label: 'Esgotados',
        count: list.filter((p) => p.stockQuantity === 0).length,
      },
    ];
  });

  protected readonly visible = computed(() => {
    const filter = this.filter();
    const filtered = this.matches().filter(
      (p) =>
        filter === 'all' ||
        (filter === 'affordable' && this.canRedeem(p)) ||
        (filter === 'soldOut' && p.stockQuantity === 0),
    );

    const sort = this.sort();
    return [...filtered].sort((a, b) => {
      if (sort === 'name') {
        return a.name.localeCompare(b.name, 'pt-BR');
      }
      return sort === 'cheap' ? a.pointCost - b.pointCost : b.pointCost - a.pointCost;
    });
  });

  ngOnInit(): void {
    this.load();
    this.balanceStore.refresh();
  }

  protected load(): void {
    this.error.set('');
    this.api.catalog().subscribe({
      next: (products) => {
        this.products.set(products);
        this.balanceStore.setCatalog(products);
      },
      error: (error) => this.error.set(errorMessage(error)),
    });
  }

  protected missingPoints(product: CatalogProduct): number {
    return Math.max(0, product.pointCost - (this.balance() ?? 0));
  }

  protected progress(product: CatalogProduct): number {
    return Math.floor(((this.balance() ?? 0) * 100) / product.pointCost);
  }

  private canRedeem(product: CatalogProduct): boolean {
    return product.stockQuantity > 0 && this.missingPoints(product) === 0;
  }

  protected async redeem(product: CatalogProduct): Promise<void> {
    const balance = this.balance() ?? 0;
    const confirmed = await this.dialogs.confirm({
      title: 'Confirmar resgate',
      item: {
        name: product.name,
        detail: `${product.pointCost} pts · 1 unidade`,
        imageUrl: product.imageDataUrl,
      },
      note: 'Depois do resgate, retire o produto com a supervisão.',
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
        this.balanceStore.setCatalog(this.products() ?? []);
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
