import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService, UserProfile } from '../../services/auth.service.js';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the login component', () => {
    expect(component).toBeTruthy();
  });

  it('should display the dialog title INICIAR SESIÓN', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('.dialog-title');
    expect(title?.textContent).toContain('INICIAR SESIÓN');
  });

  it('should show an error message if submitted with empty fields', () => {
    component.onSubmit();
    expect(component.errorMessage()).toContain('INGRESA TU NOMBRE DE AVENTURERO');
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword()).toBe(false);
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBe(true);
  });

  it('should initiate google authentication flow', () => {
    component.loginWithGoogle();
    expect(component.isLoading()).toBe(true);
    expect(component.successMessage()).toContain('GOOGLE');
  });

  it('should process OAuth query parameters and save session', () => {
    const authService = TestBed.inject(AuthService);
    const mockUser: UserProfile = {
      _id: '6ade36cbb943fa2aaa739c3f',
      name: 'Nickláus OA',
      email: 'nick047tu@gmail.com',
      roles: ['user'],
      isActive: true,
      currentRank: 'Pichón',
      totalXp: 0,
      leagueXp: 0,
    };

    authService.setAuthSession('test-jwt-token', mockUser);
    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.currentUser()?.name).toBe('Nickláus OA');
  });
});
