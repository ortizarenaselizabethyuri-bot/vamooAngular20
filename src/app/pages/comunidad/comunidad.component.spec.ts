import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ComunidadComponent } from './comunidad.component.js';

describe('ComunidadComponent', () => {
  let component: ComunidadComponent;
  let fixture: ComponentFixture<ComunidadComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComunidadComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ComunidadComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('debe crearse exitosamente el componente ComunidadComponent', () => {
    expect(component).toBeTruthy();
  });

  it('debe renderizar el título de Taberna de la Comunidad y los anuncios', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('TABERNA DE LA COMUNIDAD');
    expect(component.posts.length).toBeGreaterThanOrEqual(3);
  });

  it('debe cambiar entre la pestaña de Liga Semanal y Tablón de Expediciones', () => {
    expect(component.activeTab).toBe('liga');
    component.setTab('tablon');
    expect(component.activeTab).toBe('tablon');
    component.setTab('liga');
    expect(component.activeTab).toBe('liga');
  });

  it('debe simular el congelamiento de racha semanal con mensaje de protección', () => {
    expect(component.streakFreezeNotice).toBeNull();
    component.freezeStreak();
    expect(component.streakFreezeNotice).toContain('Racha congelada con éxito');
  });

  it('debe incrementar los honores/likes de una publicación', () => {
    const post = component.posts[0];
    const initialLikes = post.likesCount;
    component.likePost(post);
    expect(post.likesCount).toBe(initialLikes + 1);
  });

  it('debe navegar hacia /register al hacer clic en unirse al gremio', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.goToRegister();
    expect(navigateSpy).toHaveBeenCalledWith(['/register']);
  });
});
