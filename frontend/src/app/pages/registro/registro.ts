import { Component, OnDestroy, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './registro.html',
  styleUrl: './registro.scss'
})
export class Registro implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  // Campos del formulario (Signals reactivos para cambio inmediato)
  readonly nombre = signal<string>('');
  readonly correo = signal<string>('');
  readonly password = signal<string>('');
  readonly confirmPassword = signal<string>('');
  readonly codigoVerificacion = signal<string>('');

  // Estados visuales y de control
  readonly pasoActual = signal<'DATOS' | 'CODIGO' | 'EXITO'>('DATOS');
  readonly cargando = signal<boolean>(false);
  readonly enviandoCodigo = signal<boolean>(false);
  readonly errorMensaje = signal<string>('');
  readonly exitoMensaje = signal<string>('');

  // Visibilidad de contraseñas (Show / Hide Password)
  readonly verPassword = signal<boolean>(false);
  readonly verConfirmPassword = signal<boolean>(false);

  // Temporizadores
  readonly segundosRestantes = signal<number>(0);
  readonly contadorRedireccion = signal<number>(5);
  private intervaloTimer: any = null;
  private intervaloRedireccion: any = null;

  ngOnDestroy() {
    this.limpiarTimer();
    this.limpiarTimerRedireccion();
  }

  limpiarTimer() {
    if (this.intervaloTimer) {
      clearInterval(this.intervaloTimer);
      this.intervaloTimer = null;
    }
  }

  limpiarTimerRedireccion() {
    if (this.intervaloRedireccion) {
      clearInterval(this.intervaloRedireccion);
      this.intervaloRedireccion = null;
    }
  }

  iniciarTimer(segundos: number = 60) {
    this.limpiarTimer();
    this.segundosRestantes.set(segundos);
    this.intervaloTimer = setInterval(() => {
      if (this.segundosRestantes() > 0) {
        this.segundosRestantes.update(s => s - 1);
        this.cdr.markForCheck();
      } else {
        this.limpiarTimer();
        this.cdr.markForCheck();
      }
    }, 1000);
  }

  iniciarCuentaRegresivaExito() {
    this.limpiarTimerRedireccion();
    this.contadorRedireccion.set(5);
    this.intervaloRedireccion = setInterval(() => {
      if (this.contadorRedireccion() > 1) {
        this.contadorRedireccion.update(c => c - 1);
        this.cdr.markForCheck();
      } else {
        this.limpiarTimerRedireccion();
        this.irALogin();
      }
    }, 1000);
  }

  toggleVerPassword() {
    this.verPassword.update(v => !v);
  }

  toggleVerConfirmPassword() {
    this.verConfirmPassword.update(v => !v);
  }

  obtenerCorreoNormalizado(): string {
    return this.correo().trim().replace(/,/g, '.').toLowerCase();
  }

  validarDatosPaso1(): boolean {
    this.errorMensaje.set('');

    const nom = this.nombre().trim();
    if (!nom) {
      this.errorMensaje.set('El nombre completo es obligatorio.');
      return false;
    }

    if (nom.length < 3 || nom.length > 60) {
      this.errorMensaje.set('El nombre debe tener entre 3 y 60 caracteres.');
      return false;
    }

    // Solo letras y espacios (permite tildes y ñ)
    const regexNombre = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
    if (!regexNombre.test(nom)) {
      this.errorMensaje.set('El nombre solo debe contener letras y espacios, sin números ni caracteres especiales.');
      return false;
    }

    const email = this.obtenerCorreoNormalizado();
    const regexEmailUtp = /^[a-zA-Z0-9._%+-]+@utp\.edu\.pe$/;
    if (!email || !regexEmailUtp.test(email)) {
      this.errorMensaje.set('Ingresa un correo institucional válido de la UTP (ej. u12345678@utp.edu.pe).');
      return false;
    }

    const pass = this.password();
    if (!pass || pass.length < 6) {
      this.errorMensaje.set('La contraseña debe tener al menos 6 caracteres.');
      return false;
    }

    const confirmPass = this.confirmPassword();
    if (pass !== confirmPass) {
      this.errorMensaje.set('Las contraseñas no coinciden. Por favor verifícalas.');
      return false;
    }

    return true;
  }

  solicitarCodigo() {
    if (!this.validarDatosPaso1()) {
      this.cdr.markForCheck();
      return;
    }

    this.enviandoCodigo.set(true);
    this.errorMensaje.set('');
    this.exitoMensaje.set('');
    this.cdr.markForCheck();

    const correoLimpio = this.obtenerCorreoNormalizado();
    const nombreLimpio = this.nombre().trim();

    this.http.post<any>(`${environment.apiUrl}/auth/enviar-codigo-verificacion`, {
      correo: correoLimpio,
      nombre: nombreLimpio
    }).subscribe({
      next: () => {
        this.enviandoCodigo.set(false);
        this.pasoActual.set('CODIGO');
        this.codigoVerificacion.set('');
        this.exitoMensaje.set(`Hemos enviado un código de 6 dígitos a ${correoLimpio}. Revisa tu correo institucional.`);
        this.iniciarTimer(60);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.enviandoCodigo.set(false);
        const msg = err?.error?.message || err?.error || 'No se pudo enviar el código al correo. Verifica la dirección.';
        this.errorMensaje.set(typeof msg === 'string' ? msg : 'Error al enviar código de verificación.');
        this.cdr.markForCheck();
      }
    });
  }

  reenviarCodigo() {
    if (this.segundosRestantes() > 0 || this.enviandoCodigo()) return;
    this.solicitarCodigo();
  }

  regresarAPaso1() {
    this.pasoActual.set('DATOS');
    this.errorMensaje.set('');
    this.exitoMensaje.set('');
    this.cdr.markForCheck();
  }

  irALogin() {
    this.limpiarTimerRedireccion();
    const correoLimpio = this.obtenerCorreoNormalizado();
    this.router.navigate(['/login'], {
      queryParams: { registrado: 'true', correo: correoLimpio }
    });
  }

  onSubmit() {
    if (this.pasoActual() === 'DATOS') {
      this.solicitarCodigo();
      return;
    }

    if (this.pasoActual() === 'EXITO') {
      this.irALogin();
      return;
    }

    // Paso 2: Validación OTP
    this.errorMensaje.set('');
    const codigo = this.codigoVerificacion().trim();
    if (!codigo || !/^\d{6}$/.test(codigo)) {
      this.errorMensaje.set('Ingresa los 6 dígitos numéricos del código recibido en tu correo.');
      this.cdr.markForCheck();
      return;
    }

    this.cargando.set(true);
    this.cdr.markForCheck();

    const correoLimpio = this.obtenerCorreoNormalizado();
    const nuevoUsuario = {
      nombre: this.nombre().trim(),
      correo: correoLimpio,
      password: this.password(),
      rol: 'ESTUDIANTE',
      codigoVerificacion: codigo
    };

    this.http.post(`${environment.apiUrl}/usuarios`, nuevoUsuario).subscribe({
      next: () => {
        // Inicializar perfil en almacenamiento local
        localStorage.setItem('umarket_profile_' + correoLimpio, JSON.stringify({
          nombre: this.nombre().trim(),
          correo: correoLimpio,
          carrera: '',
          campus: '',
          telefono: '',
          bio: '',
          miembroDesde: '2026',
          calificacion: 'Nuevo'
        }));

        this.cargando.set(false);
        this.limpiarTimer();
        this.errorMensaje.set('');
        this.exitoMensaje.set('');
        this.pasoActual.set('EXITO');
        this.iniciarCuentaRegresivaExito();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cargando.set(false);
        const msg = err?.error?.message || err?.error || 'Error al validar el código o registrar usuario.';
        this.errorMensaje.set(typeof msg === 'string' ? msg : 'Código de verificación incorrecto o expirado.');
        this.cdr.markForCheck();
      }
    });
  }
}
