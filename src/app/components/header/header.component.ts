import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface NavButton {
  id: string;
  label: string;
  iconType: 'inicio' | 'jugar' | 'comunidad' | 'tienda' | 'login' | 'register';
  colorTheme: 'inicio' | 'jugar' | 'comunidad' | 'tienda' | 'login' | 'register';
  shapeType: 'slant-right' | 'trap-inv' | 'trap-up' | 'trap-inv-2' | 'slant-right-2' | 'slant-right-3';
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  readonly activeBtn = signal<string>('inicio');

  readonly navButtons: NavButton[] = [
    {
      id: 'inicio',
      label: 'INICIO',
      iconType: 'inicio',
      colorTheme: 'inicio',
      shapeType: 'slant-right',
    },
    {
      id: 'jugar',
      label: 'JUGAR',
      iconType: 'jugar',
      colorTheme: 'jugar',
      shapeType: 'trap-inv',
    },
    {
      id: 'comunidad',
      label: 'COMUNIDAD',
      iconType: 'comunidad',
      colorTheme: 'comunidad',
      shapeType: 'trap-up',
    },
    {
      id: 'tienda',
      label: 'TIENDA',
      iconType: 'tienda',
      colorTheme: 'tienda',
      shapeType: 'trap-inv-2',
    },
    {
      id: 'login',
      label: 'LOGIN',
      iconType: 'login',
      colorTheme: 'login',
      shapeType: 'slant-right-2',
    },
    {
      id: 'register',
      label: 'REGISTER',
      iconType: 'register',
      colorTheme: 'register',
      shapeType: 'slant-right-3',
    },
  ];

  selectNav(id: string): void {
    this.activeBtn.set(id);
  }
}
