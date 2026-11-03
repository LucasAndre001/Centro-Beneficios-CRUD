import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BalanceStore {
  private readonly http = inject(HttpClient);

  readonly balance = signal<number | null>(null);

  refresh(): void {
    this.http
      .get<{ pointsBalance: number }>(`${environment.apiUrl}/api/me/balance`)
      .subscribe({ next: (result) => this.balance.set(result.pointsBalance) });
  }

  set(value: number): void {
    this.balance.set(value);
  }
}
