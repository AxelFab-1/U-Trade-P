import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  correo: string = '';
  password: string = '';
  cargando: boolean = false;
  errorMensaje: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    this.errorMensaje = '';
    if (!this.correo || !this.password) {
      this.errorMensaje = 'Por favor ingresa tu correo y contraseña.';
      return;
    }

    this.cargando = true;
    this.authService.login({ correo: this.correo, password: this.password }).subscribe({
      next: () => {
        this.cargando = false;
        this.router.navigate(['/explorar']);
      },
      error: () => {
        this.cargando = false;
        this.errorMensaje = 'Credenciales inválidas. Verifica tu correo y contraseña.';
      }
    });
  }
}
