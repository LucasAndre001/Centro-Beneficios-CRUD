import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AdminApi } from '../../../api/admin-api.service';
import { errorMessage } from '../../../core/api-error';
import { DialogService } from '../../../core/dialog.service';
import { resizeImage } from '../../../core/image';
import { ProductRequest } from '../../../core/models';
import { Icon } from '../../../shared/icon/icon';
import { ImageCropper } from '../../../shared/image-cropper/image-cropper';
import { Modal } from '../../../shared/modal/modal';

@Component({
  selector: 'app-product-form-dialog',
  imports: [Modal, ReactiveFormsModule, Icon, ImageCropper],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-form-dialog.html',
  styleUrls: ['../dialogs/dialogs.css', './product-form-dialog.css'],
})
export class ProductFormDialog implements OnInit {
  private readonly api = inject(AdminApi);
  private readonly dialogs = inject(DialogService);

  readonly productId = input<number | null>(null);
  readonly closed = output<void>();
  readonly saved = output<void>();

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    stockQuantity: [0, [Validators.required, Validators.min(0)]],
    pointCost: [0, [Validators.required, Validators.min(0)]],
    description: ['', Validators.maxLength(500)],
  });

  protected readonly image = signal<string | null>(null);
  private readonly cropper = viewChild(ImageCropper);
  private newFileChosen = false;
  protected readonly dragging = signal(false);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');

  ngOnInit(): void {
    const id = this.productId();
    if (id === null) {
      return;
    }

    this.loading.set(true);
    this.api.product(id).subscribe({
      next: (product) => {
        this.form.setValue({
          name: product.name,
          stockQuantity: product.stockQuantity,
          pointCost: product.pointCost,
          description: product.description,
        });
        this.image.set(product.imageDataUrl);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(errorMessage(error));
        this.loading.set(false);
      },
    });
  }

  protected onFileSelected(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0];
    inputElement.value = '';
    if (file) {
      this.useFile(file);
    }
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.useFile(file);
    }
  }

  protected async save(publish: boolean): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Informe o nome, o estoque e o valor do produto.');
      return;
    }

    const value = this.form.getRawValue();
    if (publish && value.pointCost <= 0) {
      this.error.set('Para postar, o valor em pontos precisa ser maior que zero.');
      return;
    }

    const request: ProductRequest = {
      name: value.name.trim(),
      description: value.description.trim(),
      stockQuantity: value.stockQuantity,
      pointCost: value.pointCost,
      imageDataUrl: this.finalImage(),
      publish,
    };

    this.saving.set(true);
    this.error.set('');

    try {
      const id = this.productId();
      const product = await firstValueFrom(
        id === null ? this.api.createProduct(request) : this.api.updateProduct(id, request),
      );

      if (!publish) {
        this.dialogs.success(
          'Produto salvo como rascunho',
          `${product.name} ainda não aparece na loja.`,
        );
      } else {
        this.dialogs.success(
          id === null ? 'Produto criado' : 'Produto alterado',
          `${product.name} está disponível na loja.`,
        );
      }

      this.saved.emit();
      this.closed.emit();
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  protected async deactivate(): Promise<void> {
    const id = this.productId();
    if (id === null) {
      return;
    }

    const name = this.form.controls.name.value;
    const confirmed = await this.dialogs.confirm({
      title: 'Excluir produto?',
      message: `${name} sai da loja. Os resgates já feitos continuam no histórico.`,
      confirmLabel: 'Excluir',
      danger: true,
    });

    if (!confirmed) {
      return;
    }

    try {
      await firstValueFrom(this.api.setProductStatus(id, 'Inactive'));
      this.dialogs.success('Produto excluído', `${name} não aparece mais na loja.`);
      this.saved.emit();
      this.closed.emit();
    } catch (error) {
      this.error.set(errorMessage(error));
    }
  }

  protected removeImage(): void {
    this.image.set(null);
    this.newFileChosen = false;
  }

  // Foto nova sempre sai recortada no formato do card; foto já salva só é refeita se foi ajustada
  private finalImage(): string | null {
    const cropper = this.cropper();
    if (!this.image() || !cropper) {
      return this.image();
    }
    return this.newFileChosen || cropper.changed() ? cropper.export() : this.image();
  }

  private async useFile(file: File): Promise<void> {
    try {
      this.image.set(await resizeImage(file, 1600, 0.9));
      this.newFileChosen = true;
      this.error.set('');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Imagem inválida.');
    }
  }
}
