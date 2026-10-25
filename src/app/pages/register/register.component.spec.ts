import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RegisterComponent } from './register.component.js';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('debe crearse exitosamente el componente RegisterComponent', () => {
    expect(component).toBeTruthy();
  });

  it('debe validar que los campos obligatorios no estén vacíos al enviar', () => {
    component.username.set('');
    component.onSubmit();
    expect(component.errorMessage()).toContain('¡INGRESA TU NOMBRE DE AVENTURERO!');
  });

  it('debe validar coincidencia de contraseñas', () => {
    component.username.set('Aventurero');
    component.email.set('aventurero@vamoo.com');
    component.password.set('1234');
    component.confirmPassword.set('5678');
    component.onSubmit();
    expect(component.errorMessage()).toContain('¡LAS CONTRASEÑAS NO COINCIDEN!');
  });

  it('debe alternar visibilidad de contraseña', () => {
    expect(component.showPassword()).toBe(false);
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBe(true);
  });

  it('debe navegar hacia /login al hacer clic en INICIAR SESIÓN', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.goToLogin();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});
