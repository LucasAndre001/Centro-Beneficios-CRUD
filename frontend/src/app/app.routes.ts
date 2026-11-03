import { Routes } from '@angular/router';
import { authGuard, guestGuard, homeRedirectGuard, roleGuard } from './core/auth.guards';
import { Shell } from './layout/shell/shell';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Entrar | Centro de Benefícios',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [homeRedirectGuard],
        children: [],
      },
      {
        path: 'inicio',
        title: 'Início | Centro de Benefícios',
        canActivate: [roleGuard('Employee')],
        loadComponent: () => import('./pages/employee/home/home').then((m) => m.EmployeeHome),
      },
      {
        path: 'loja',
        title: 'Loja | Centro de Benefícios',
        canActivate: [roleGuard('Employee')],
        loadComponent: () => import('./pages/employee/shop/shop').then((m) => m.Shop),
      },
      {
        path: 'jogos',
        title: 'Jogos | Centro de Benefícios',
        loadComponent: () => import('./pages/games/games').then((m) => m.Games),
      },
      {
        path: 'admin',
        title: 'Painel | Centro de Benefícios',
        canActivate: [roleGuard('Admin')],
        loadComponent: () => import('./pages/admin/home/home').then((m) => m.AdminHome),
      },
      {
        path: 'admin/funcionarios',
        title: 'Funcionários | Centro de Benefícios',
        canActivate: [roleGuard('Admin')],
        loadComponent: () => import('./pages/admin/employees/employees').then((m) => m.Employees),
      },
      {
        path: 'admin/produtos',
        title: 'Produtos | Centro de Benefícios',
        canActivate: [roleGuard('Admin')],
        loadComponent: () => import('./pages/admin/products/products').then((m) => m.Products),
      },
      {
        path: 'admin/resgates',
        title: 'Resgates | Centro de Benefícios',
        canActivate: [roleGuard('Admin')],
        loadComponent: () =>
          import('./pages/admin/redemptions/redemptions').then((m) => m.Redemptions),
      },
      {
        path: 'admin/sorteio',
        title: 'Sorteio | Centro de Benefícios',
        canActivate: [roleGuard('Admin')],
        loadComponent: () => import('./pages/admin/raffle/raffle').then((m) => m.Raffle),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
