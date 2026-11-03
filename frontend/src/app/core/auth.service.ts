import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginResponse, Role, UserInfo } from './models';

const STORAGE_KEY = 'cb.session';

interface Session {
  token: string;
  expiresAt: string;
  user: UserInfo;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly session = signal<Session | null>(this.restore());

  readonly user = computed(() => this.session()?.user ?? null);
  readonly token = computed(() => this.session()?.token ?? null);

  login(email: string, password: string): Observable<UserInfo> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/api/auth/login`, { email, password })
      .pipe(
        tap((response) => this.store(response)),
        map((response) => response.user),
      );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.session.set(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    const current = this.session();

    if (current && new Date(current.expiresAt) <= new Date()) {
      localStorage.removeItem(STORAGE_KEY);
      this.session.set(null);
      return false;
    }

    return current !== null;
  }

  hasRole(role: Role): boolean {
    return this.isLoggedIn() && this.user()?.role === role;
  }

  homePath(): string {
    return this.user()?.role === 'Admin' ? '/admin' : '/inicio';
  }

  private store(response: LoginResponse): void {
    const session: Session = {
      token: response.token,
      expiresAt: response.expiresAt,
      user: response.user,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    this.session.set(session);
  }

  private restore(): Session | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const session = raw ? (JSON.parse(raw) as Session) : null;
      return session && new Date(session.expiresAt) > new Date() ? session : null;
    } catch {
      return null;
    }
  }
}
