import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HeaderComponent } from './header.component.js';
import { AuthService } from '../../services/auth.service.js';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let authService: AuthService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([{ path: '**', component: HeaderComponent }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the header component', () => {
    expect(component).toBeTruthy();
  });

  it('should display the brand title VAMOO', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const titleElement = compiled.querySelector('.pixel-logo-vamoo');
    expect(titleElement?.textContent).toContain('VAMOO');
  });

  it('should render 5 pixel navigation buttons when not authenticated', () => {
    expect(component.visibleNavButtons.length).toBe(5);
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('.pixel-nav-btn');
    expect(buttons.length).toBe(5);
  });

  it('should allow selecting an active navigation item', () => {
    component.selectNav('jugar');
    expect(component.activeBtn()).toBe('jugar');
  });

  it('should hide login and register and show user profile badge when authenticated', () => {
    authService.setAuthSession('mock-token', {
      _id: '123',
      name: 'Aventurero_Inti',
      email: 'inti@vamoo.com',
      roles: ['user'],
      currentRank: 'Flamenco',
      totalXp: 350,
      leagueXp: 120,
      isActive: true,
    });

    fixture.detectChanges();

    // Ahora sólo deben verse 3 botones de navegación (inicio, jugar, comunidad)
    expect(component.visibleNavButtons.length).toBe(3);
    expect(component.visibleNavButtons.map((b) => b.id)).toEqual(['inicio', 'jugar', 'comunidad']);

    const compiled = fixture.nativeElement as HTMLElement;
    const userBadge = compiled.querySelector('.user-profile-badge');
    expect(userBadge).toBeTruthy();
    expect(compiled.textContent).toContain('Aventurero_Inti');
    expect(compiled.textContent).toContain('Flamenco');
  });

  it('should toggle user dropdown menu and handle logout', () => {
    authService.setAuthSession('mock-token', {
      _id: '123',
      name: 'Aventurero_Inti',
      email: 'inti@vamoo.com',
      roles: ['user'],
      currentRank: 'Pichón',
      totalXp: 100,
      leagueXp: 50,
      isActive: true,
    });

    component.toggleUserMenu();
    expect(component.isUserMenuOpen()).toBe(true);

    component.logout();
    expect(authService.isAuthenticated()).toBe(false);
    expect(component.visibleNavButtons.length).toBe(5);
  });
});
