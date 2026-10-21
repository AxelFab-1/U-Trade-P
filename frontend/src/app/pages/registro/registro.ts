import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

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
    console.log('Formulario válido');
  }
}
