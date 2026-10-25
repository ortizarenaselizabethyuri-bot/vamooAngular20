import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the header component', () => {
    expect(component).toBeTruthy();
  });

  it('should display the brand title VAMOO', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const titleElement = compiled.querySelector('.pixel-logo-vamoo');
    expect(titleElement?.textContent).toContain('VAMOO');
  });

  it('should render 5 pixel navigation buttons', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('.pixel-nav-btn');
    expect(buttons.length).toBe(5);
  });

  it('should allow selecting an active navigation item', () => {
    component.selectNav('jugar');
    expect(component.activeBtn()).toBe('jugar');
  });
});
