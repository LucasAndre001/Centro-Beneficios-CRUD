import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { BalanceStore } from '../../core/balance.store';
import { Icon, IconName } from '../../shared/icon/icon';

interface NavItem {
  path: string;
  label: string;
  icon: IconName;
  soon?: boolean;
}

const EMPLOYEE_NAV: NavItem[] = [
  { path: '/inicio', label: 'Início', icon: 'home' },
  { path: '/loja', label: 'Loja', icon: 'shop' },
  { path: '/jogos', label: 'Jogos', icon: 'game' },
];

const ADMIN_NAV: NavItem[] = [
  { path: '/admin', label: 'Início', icon: 'home' },
  { path: '/admin/funcionarios', label: 'Funcionários', icon: 'users' },
  { path: '/admin/produtos', label: 'Produtos', icon: 'box' },
  { path: '/admin/resgates', label: 'Resgates', icon: 'receipt' },
  { path: '/jogos', label: 'Jogos', icon: 'game' },
  { path: '/admin/sorteio', label: 'Sorteio', icon: 'gift', soon: true },
];

const MOBILE_BREAKPOINT = 900;

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly balanceStore = inject(BalanceStore);
  protected readonly balance = this.balanceStore.balance;

  protected readonly user = this.auth.user;
  protected readonly isAdmin = computed(() => this.user()?.role === 'Admin');
  protected readonly navItems = computed(() => (this.isAdmin() ? ADMIN_NAV : EMPLOYEE_NAV));
  protected readonly initials = computed(() =>
    (this.user()?.name ?? '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join(''),
  );
  protected readonly menuOpen = signal(window.innerWidth > MOBILE_BREAKPOINT);

  ngOnInit(): void {
    if (!this.isAdmin()) {
      this.balanceStore.refresh();
    }
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenuOnMobile(): void {
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      this.menuOpen.set(false);
    }
  }

  protected logout(): void {
    this.auth.logout();
  }
}
