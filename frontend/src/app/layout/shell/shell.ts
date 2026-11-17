import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { BalanceStore } from '../../core/balance.store';
import { initialsOf } from '../../core/text';
import { ThemePreference, ThemeService } from '../../core/theme.service';
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

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'auto', label: 'Automático' },
];

const MOBILE_BREAKPOINT = 900;

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.html',
  styleUrl: './shell.css',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'userMenuOpen.set(false)',
  },
})
export class Shell implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly balanceStore = inject(BalanceStore);
  protected readonly theme = inject(ThemeService);

  protected readonly balance = this.balanceStore.balance;
  protected readonly affordable = this.balanceStore.affordableCount;
  protected readonly themeOptions = THEME_OPTIONS;

  protected readonly user = this.auth.user;
  protected readonly isAdmin = computed(() => this.user()?.role === 'Admin');
  protected readonly navItems = computed(() => (this.isAdmin() ? ADMIN_NAV : EMPLOYEE_NAV));
  protected readonly initials = computed(() => initialsOf(this.user()?.name ?? ''));

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly pageLabel = computed(() => {
    const path = this.url().split('?')[0];
    return this.navItems().find((item) => item.path === path)?.label ?? '';
  });

  protected readonly menuOpen = signal(window.innerWidth > MOBILE_BREAKPOINT);
  protected readonly userMenuOpen = signal(false);
  private readonly userArea = viewChild.required<ElementRef<HTMLElement>>('userArea');

  ngOnInit(): void {
    if (!this.isAdmin()) {
      this.balanceStore.refresh();
      this.balanceStore.refreshCatalog();
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

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.userArea().nativeElement.contains(event.target as Node)) {
      this.userMenuOpen.set(false);
    }
  }

  protected logout(): void {
    this.auth.logout();
  }
}
