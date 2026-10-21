import { Component } from '@angular/core';
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
export class Registro {
  nombre: string = '';
  correo: string = '';
  password: string = '';
  carrera: string = '';
  universidad: string = 'UTP';

  errorMensaje: string = '';
  exitoMensaje: string = '';
  cargando: boolean = false;

  constructor(private http: HttpClient, private router: Router) {}

  validarFormulario(): boolean {
    this.errorMensaje = '';

    if (!this.nombre.trim()) {
      this.errorMensaje = 'El nombre completo es obligatorio.';
      return false;
    }

    const correoLimpio = this.correo.trim().toLowerCase();
    if (!correoLimpio || !correoLimpio.endsWith('@utp.edu.pe')) {
      this.errorMensaje = 'Solo se permiten correos institucionales de la UTP (@utp.edu.pe).';
      return false;
    }

    if (!this.password || this.password.length < 4) {
      this.errorMensaje = 'La contraseña debe tener un mínimo de 4 caracteres.';
      return false;
    }

    return true;
  }

  onSubmit() {
    if (!this.validarFormulario()) {
      return;
    }

    this.cargando = true;
    const nuevoUsuario = {
      nombre: this.nombre.trim(),
      correo: this.correo.trim().toLowerCase(),
      password: this.password,
      rol: 'ESTUDIANTE'
    };

    this.http.post(`${environment.apiUrl}/usuarios`, nuevoUsuario).subscribe({
      next: () => {
        this.cargando = false;
        this.exitoMensaje = '¡Cuenta creada con éxito! Redirigiendo al inicio de sesión...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (err) => {
        this.cargando = false;
        this.errorMensaje = err?.error || 'Error al registrar usuario. Inténtalo de nuevo.';
      }
    });
  }
}
