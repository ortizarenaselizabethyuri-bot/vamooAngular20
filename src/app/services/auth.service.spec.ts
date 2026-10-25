import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService, AuthResponse } from './auth.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockAuthResponse: AuthResponse = {
    accessToken: 'mock-jwt-token-xyz',
    user: {
      _id: '507f1f77bcf86cd799439011',
      name: 'Aventurero Inti',
      email: 'inti@vamoo.com',
      roles: ['user'],
      currentRank: 'Pichón',
      totalXp: 100,
      leagueXp: 50,
      isActive: true,
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('debe crearse exitosamente el servicio AuthService', () => {
    expect(service).toBeTruthy();
  });

  it('debe realizar login y guardar sesión reactiva', () => {
    service.login({ email: 'inti@vamoo.com', password: 'Password123!' }).subscribe((res) => {
      expect(res.accessToken).toBe('mock-jwt-token-xyz');
      expect(res.user.name).toBe('Aventurero Inti');
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/auth/login'));
    expect(req.request.method).toBe('POST');
    req.flush(mockAuthResponse);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.email).toBe('inti@vamoo.com');
  });

  it('debe registrar un nuevo usuario y guardar sesión', () => {
    service.register({ name: 'Nuevo Aventurero', email: 'nuevo@vamoo.com', password: 'Password123!' }).subscribe((res) => {
      expect(res.accessToken).toBe('mock-jwt-token-xyz');
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/auth/register'));
    expect(req.request.method).toBe('POST');
    req.flush(mockAuthResponse);

    expect(service.isAuthenticated()).toBe(true);
  });

  it('debe retornar URL de Google OAuth', () => {
    const url = service.getGoogleAuthUrl();
    expect(url).toContain('/auth/google');
  });

  it('debe limpiar sesión al hacer logout', () => {
    service.logout();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });
});
