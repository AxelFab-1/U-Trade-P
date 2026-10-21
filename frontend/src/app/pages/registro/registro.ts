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

  onSubmit() {
    console.log('Registro enviado');
  }
}
