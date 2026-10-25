import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { provideRouter } from '@angular/router';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([])],
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
});
