import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  // Signals reactivos
  readonly correo = signal<string>('');
  readonly password = signal<string>('');
  readonly verPassword = signal<boolean>(false);
  readonly cargando = signal<boolean>(false);
  readonly errorMensaje = signal<string>('');
  readonly exitoMensaje = signal<string>('');

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['registrado'] === 'true') {
        this.exitoMensaje.set('¡Tu cuenta institucional fue creada exitosamente! 🎉 Ingresa tu contraseña para acceder.');
      }
      if (params['correo']) {
        this.correo.set(params['correo']);
      }
      this.cdr.markForCheck();
    });
  }

  toggleVerPassword() {
    this.verPassword.update(v => !v);
  }

  onLogin() {
    this.errorMensaje.set('');

    const emailRaw = this.correo().trim();
    const pass = this.password();

    if (!emailRaw || !pass) {
      this.errorMensaje.set('Por favor ingresa tu correo institucional y contraseña.');
      this.cdr.markForCheck();
      return;
    }

    // Normalizar correo: convertir comas a puntos en caso de error tipográfico, recortar y pasar a minúsculas
    const emailNormalizado = emailRaw.replace(/,/g, '.').toLowerCase();

    if (!emailNormalizado.endsWith('@utp.edu.pe')) {
      this.errorMensaje.set('El correo debe pertenecer al dominio institucional (@utp.edu.pe).');
      this.cdr.markForCheck();
      return;
    }

    this.cargando.set(true);
    this.cdr.markForCheck();

    this.authService.login({ correo: emailNormalizado, password: pass }).subscribe({
      next: () => {
        this.cargando.set(false);
        this.cdr.markForCheck();
        this.router.navigate(['/explorar']);
      },
      error: (err) => {
        this.cargando.set(false);
        const backendMsg = err?.error?.message || err?.error;
        if (typeof backendMsg === 'string' && backendMsg.length < 100) {
          this.errorMensaje.set(backendMsg);
        } else {
          this.errorMensaje.set('Credenciales inválidas. Verifica tu correo y contraseña.');
        }
        this.cdr.markForCheck();
      }
    });
  }
}
