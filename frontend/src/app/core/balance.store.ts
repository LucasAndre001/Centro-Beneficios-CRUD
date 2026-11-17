import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { EmployeeApi } from '../api/employee-api.service';
import { CatalogProduct } from './models';

@Injectable({ providedIn: 'root' })
export class BalanceStore {
  private readonly http = inject(HttpClient);
  private readonly employeeApi = inject(EmployeeApi);

  readonly balance = signal<number | null>(null);
  readonly catalog = signal<CatalogProduct[] | null>(null);

  readonly affordableCount = computed(() => {
    const balance = this.balance();
    const catalog = this.catalog();
    if (balance === null || catalog === null) {
      return null;
    }
    return catalog.filter((p) => p.stockQuantity > 0 && p.pointCost <= balance).length;
  });

  refresh(): void {
    this.http
      .get<{ pointsBalance: number }>(`${environment.apiUrl}/api/me/balance`)
      .subscribe({ next: (result) => this.balance.set(result.pointsBalance) });
  }

  refreshCatalog(): void {
    this.employeeApi.catalog().subscribe({ next: (products) => this.catalog.set(products) });
  }

  set(value: number): void {
    this.balance.set(value);
  }

  setCatalog(products: CatalogProduct[]): void {
    this.catalog.set(products);
  }
}
