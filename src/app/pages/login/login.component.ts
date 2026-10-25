import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  username = signal<string>('');
  password = signal<string>('');
  rememberMe = signal<boolean>(true);
  showPassword = signal<boolean>(false);

  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  isLoading = signal<boolean>(false);

  constructor(private router: Router) {}

  togglePasswordVisibility(): void {
    this.showPassword.update((val) => !val);
  }

  onSubmit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    const user = this.username().trim();
    const pass = this.password().trim();

    if (!user) {
      this.errorMessage.set('¡INGRESA TU NOMBRE DE AVENTURERO O EMAIL!');
      return;
    }

    if (!pass) {
      this.errorMessage.set('¡DEBES INGRESAR TU CONTRASEÑA!');
      return;
    }

    if (pass.length < 4) {
      this.errorMessage.set('LA CONTRASEÑA DEBE TENER AL MENOS 4 CARACTERES.');
      return;
    }

    this.isLoading.set(true);

    // Simulación de autenticación RPG
    setTimeout(() => {
      this.isLoading.set(false);
      this.successMessage.set(`¡BIENVENIDO AL GREMIO, ${user.toUpperCase()}!`);
    }, 600);
  }

  goToRegister(): void {
    // Redirige o activa evento para registro
    this.router.navigate(['/register']);
  }
}
