import { computed, effect, Injectable, signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'auto';

const STORAGE_KEY = 'cb.theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly preference = signal<ThemePreference>(readPreference());

  private readonly systemDark = signal(window.matchMedia(DARK_QUERY).matches);

  readonly isDark = computed(() =>
    this.preference() === 'auto' ? this.systemDark() : this.preference() === 'dark',
  );

  constructor() {
    window
      .matchMedia(DARK_QUERY)
      .addEventListener('change', (event) => this.systemDark.set(event.matches));

    effect(() => {
      const dark = this.isDark();
      document.documentElement.dataset['theme'] = dark ? 'dark' : 'light';
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', dark ? '#252440' : '#002e80');
    });
  }

  set(preference: ThemePreference): void {
    this.preference.set(preference);
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // Sem armazenamento local o tema vale só até fechar a aba
    }
  }

  toggle(): void {
    this.set(this.isDark() ? 'light' : 'dark');
  }
}

function readPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'auto';
  } catch {
    return 'auto';
  }
}
