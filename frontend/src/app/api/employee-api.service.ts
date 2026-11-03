import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CatalogProduct, EmployeeDashboard, RedeemResult } from '../core/models';

@Injectable({ providedIn: 'root' })
export class EmployeeApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api`;

  dashboard(): Observable<EmployeeDashboard> {
    return this.http.get<EmployeeDashboard>(`${this.baseUrl}/me/dashboard`);
  }

  catalog(): Observable<CatalogProduct[]> {
    return this.http.get<CatalogProduct[]>(`${this.baseUrl}/products`);
  }

  redeem(productId: number): Observable<RedeemResult> {
    return this.http.post<RedeemResult>(`${this.baseUrl}/redemptions`, { productId, quantity: 1 });
  }
}
