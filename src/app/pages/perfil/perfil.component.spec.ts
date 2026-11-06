import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { PerfilComponent } from './perfil.component.js';
import { AuthService } from '../../services/auth.service.js';

describe('PerfilComponent', () => {
  let component: PerfilComponent;
  let fixture: ComponentFixture<PerfilComponent>;
  let router: Router;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilComponent],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService);
    fixture.detectChanges();
  });

  it('debe crearse exitosamente el componente PerfilComponent', () => {
    expect(component).toBeTruthy();
  });

  it('debe calcular correctamente el nivel estilo Steam a partir de XP', () => {
    expect(component.steamLevel()).toBeGreaterThanOrEqual(1);
  });

  it('debe alternar pestañas entre resumen, insignias, salud, actividad y comentarios', () => {
    expect(component.activeTab()).toBe('resumen');
    component.setTab('insignias');
    expect(component.activeTab()).toBe('insignias');
    component.setTab('salud');
    expect(component.activeTab()).toBe('salud');
    component.setTab('actividad');
    expect(component.activeTab()).toBe('actividad');
    component.setTab('comentarios');
    expect(component.activeTab()).toBe('comentarios');
  });

  it('debe estimar correctamente los pasos y calorías quemadas a partir de la distancia', () => {
    expect(component.calcSteps(2)).toBe(2700);
    expect(component.calcCalories(2)).toBe(124);
    expect(component.totalSteps()).toBeGreaterThan(0);
    expect(component.totalCalories()).toBeGreaterThan(0);
    expect(component.totalCo2Saved()).toBeGreaterThan(0);
  });

  it('debe cargar los beneficios de salud y permitir filtrarlos por categoría', () => {
    expect(component.healthBenefits().length).toBeGreaterThan(0);
    component.setBenefitFilter('cardiovascular');
    expect(component.selectedBenefitFilter()).toBe('cardiovascular');
    expect(component.filteredBenefits().every((b) => b.category === 'cardiovascular')).toBe(true);

    component.setBenefitFilter('todos');
    expect(component.filteredBenefits().length).toBe(component.healthBenefits().length);
  });

  it('debe actualizar los cálculos del simulador interactivo de caminata', () => {
    component.setSimulatedKm(10);
    expect(component.simulatedKm()).toBe(10);
    expect(component.simulatedSteps()).toBe(13500);
    expect(component.simulatedCalories()).toBe(620);
    expect(component.simulatedCo2()).toBe(1.5);
  });

  it('debe abrir y cerrar el modal de edición de perfil', () => {
    expect(component.isEditModalOpen()).toBe(false);
    component.openEditModal();
    expect(component.isEditModalOpen()).toBe(true);
    component.closeEditModal();
    expect(component.isEditModalOpen()).toBe(false);
  });

  it('debe abrir y cerrar el modal de selector de insignias', () => {
    expect(component.isBadgeModalOpen()).toBe(false);
    component.openBadgeSelectorModal();
    expect(component.isBadgeModalOpen()).toBe(true);
    component.closeBadgeModal();
    expect(component.isBadgeModalOpen()).toBe(false);
  });

  it('debe permitir publicar un comentario en el muro social', () => {
    const initialCount = component.comments().length;
    component.newCommentText = '¡Excelente perfil de aventurero!';
    component.postComment();
    expect(component.comments().length).toBe(initialCount + 1);
    expect(component.comments()[0].content).toBe('¡Excelente perfil de aventurero!');
  });

  it('debe navegar hacia /jugar al llamar goToGame', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.goToGame();
    expect(navigateSpy).toHaveBeenCalledWith(['/jugar']);
  });

  it('debe alternar entre modo oscuro y claro', () => {
    const initialMode = component.themeService.isDark();
    component.toggleTheme();
    expect(component.themeService.isDark()).toBe(!initialMode);
    component.toggleTheme();
    expect(component.themeService.isDark()).toBe(initialMode);
  });
});

