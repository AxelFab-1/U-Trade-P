import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'umarket_theme';
  readonly isDarkMode = signal<boolean>(false);

  constructor() {
    this.initTheme();
  }

  private initTheme(): void {
    if (typeof window === 'undefined') return;

    const savedTheme = localStorage.getItem(this.THEME_KEY);
    if (savedTheme) {
      const isDark = savedTheme === 'dark';
      this.isDarkMode.set(isDark);
      this.applyTheme(isDark);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDarkMode.set(prefersDark);
      this.applyTheme(prefersDark);
    }
  }

  toggleTheme(): void {
    const nuevoEstado = !this.isDarkMode();
    this.isDarkMode.set(nuevoEstado);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.THEME_KEY, nuevoEstado ? 'dark' : 'light');
    }
    this.applyTheme(nuevoEstado);
  }

  private applyTheme(isDark: boolean): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (isDark) {
      root.setAttribute('data-theme', 'dark');
      root.classList.add('dark-theme');
    } else {
      root.setAttribute('data-theme', 'light');
      root.classList.remove('dark-theme');
    }
  }
}
