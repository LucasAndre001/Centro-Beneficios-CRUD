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
import { AdminApi } from '../../../api/admin-api.service';
import { errorMessage } from '../../../core/api-error';
import { DialogService } from '../../../core/dialog.service';
import { ProductSummary } from '../../../core/models';
import { Icon } from '../../../shared/icon/icon';
import { ProductFormDialog } from './product-form-dialog';

@Component({
  selector: 'app-products',
  imports: [Icon, ProductFormDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './products.html',
})
export class Products implements OnInit {
  private readonly api = inject(AdminApi);
  private readonly dialogs = inject(DialogService);
  private readonly router = inject(Router);

  readonly novo = input<string>();

  protected readonly products = signal<ProductSummary[] | null>(null);
  protected readonly search = signal('');
  protected readonly showInactive = signal(false);
  protected readonly error = signal('');
  protected readonly editingId = signal<number | null | undefined>(undefined);

  protected readonly visible = computed(() => {
    const term = this.search().trim().toLowerCase();
    return (this.products() ?? []).filter(
      (product) =>
        (this.showInactive() || product.status !== 'Inactive') &&
        product.name.toLowerCase().includes(term),
    );
  });

  ngOnInit(): void {
    this.load();

    if (this.novo()) {
      this.editingId.set(null);
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
    }
  }

  protected load(): void {
    this.error.set('');
    this.api.products('', true).subscribe({
      next: (products) => this.products.set(products),
      error: (error) => this.error.set(errorMessage(error)),
    });
  }

  protected async deactivate(product: ProductSummary): Promise<void> {
    const confirmed = await this.dialogs.confirm({
      title: 'Excluir produto?',
      message: `${product.name} sai da loja. Os resgates já feitos continuam no histórico.`,
      confirmLabel: 'Excluir',
      danger: true,
    });

    if (!confirmed) {
      return;
    }

    this.api.setProductStatus(product.id, 'Inactive').subscribe({
      next: () => {
        this.dialogs.success('Produto excluído', `${product.name} não aparece mais na loja.`);
        this.load();
      },
      error: (error) => this.dialogs.error('Não foi possível excluir', errorMessage(error)),
    });
  }

  protected reactivate(product: ProductSummary): void {
    this.api.setProductStatus(product.id, 'Draft').subscribe({
      next: () => {
        this.dialogs.success(
          'Produto reativado',
          `${product.name} voltou como rascunho. Edite e clique em Postar para colocá-lo na loja.`,
        );
        this.load();
      },
      error: (error) => this.dialogs.error('Não foi possível reativar', errorMessage(error)),
    });
  }
}
