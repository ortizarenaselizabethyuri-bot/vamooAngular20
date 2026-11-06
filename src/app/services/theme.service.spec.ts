import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service.js';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  it('debe crearse exitosamente el ThemeService', () => {
    expect(service).toBeTruthy();
  });

  it('debe alternar entre dark y light al llamar toggleTheme', () => {
    const current = service.currentTheme();
    service.toggleTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    expect(service.currentTheme()).toBe(next);
    service.toggleTheme();
    expect(service.currentTheme()).toBe(current);
  });

  it('debe establecer un tema explícito con setTheme', () => {
    service.setTheme('light');
    expect(service.currentTheme()).toBe('light');
    expect(service.isDark()).toBe(false);

    service.setTheme('dark');
    expect(service.currentTheme()).toBe('dark');
    expect(service.isDark()).toBe(true);
  });
});

