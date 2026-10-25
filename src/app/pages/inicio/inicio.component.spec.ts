import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { InicioComponent } from './inicio.component.js';

describe('InicioComponent', () => {
  let component: InicioComponent;
  let fixture: ComponentFixture<InicioComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InicioComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(InicioComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('debe crearse exitosamente el componente InicioComponent', () => {
    expect(component).toBeTruthy();
  });

  it('debe renderizar el título de bienvenida al reino', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('REINO DE VAMOO');
    expect(compiled.textContent).toContain('¡BIENVENIDO, AVENTURERO!');
  });

  it('debe navegar hacia /jugar al hacer clic en JUGAR AHORA', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.goToPlay();
    expect(navigateSpy).toHaveBeenCalledWith(['/jugar']);
  });

  it('debe navegar hacia /comunidad al llamar goToCommunity', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.goToCommunity();
    expect(navigateSpy).toHaveBeenCalledWith(['/comunidad']);
  });

  it('debe navegar hacia /login al llamar goToLogin', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.goToLogin();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});
