import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Role } from './models';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn() || inject(Router).createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return !auth.isLoggedIn() || inject(Router).createUrlTree([auth.homePath()]);
};

export const homeRedirectGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const target = auth.isLoggedIn() ? auth.homePath() : '/login';
  return inject(Router).createUrlTree([target]);
};

export function roleGuard(role: Role): CanActivateFn {
  return () => {
    const auth = inject(AuthService);

    if (auth.hasRole(role)) {
      return true;
    }

    const target = auth.isLoggedIn() ? auth.homePath() : '/login';
    return inject(Router).createUrlTree([target]);
  };
}
