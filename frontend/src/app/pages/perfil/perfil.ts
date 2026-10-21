import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Producto } from '../../core/models/producto.model';

export interface PerfilEstudiante {
  nombre: string;
  correo: string;
  telefono: string;
  carrera: string;
  campus: string;
  bio: string;
  avatar: string;
}

@Component({
  selector: 'app-perfil',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);

  readonly estudiante = signal<PerfilEstudiante>({
    nombre: 'Fabian Z. A.',
    correo: 'u21200000@utp.edu.pe',
    telefono: '987654321',
    carrera: 'Ingeniería de Sistemas e Informática',
    campus: 'Campus Lima Centro',
    bio: 'Estudiante de 8vo ciclo apasionado por el desarrollo de software, tecnología y gadgets universitarios.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=FabianUTP'
  });

  readonly guardadoExitoso = signal(false);
  readonly isSubmitted = signal(false);
  readonly misPublicaciones = signal<Producto[]>([]);
  readonly cargandoPublicaciones = signal(false);

  readonly perfilForm: FormGroup = this.fb.group({
    nombre: [this.estudiante().nombre, [Validators.required, Validators.minLength(3)]],
    correo: [{ value: this.estudiante().correo, disabled: true }, [Validators.required, Validators.email]],
    telefono: [this.estudiante().telefono, [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],
    carrera: [this.estudiante().carrera, [Validators.required]],
    campus: [this.estudiante().campus, [Validators.required]],
    bio: [this.estudiante().bio, [Validators.maxLength(200)]]
  });

  ngOnInit() {
    this.cargarMisPublicaciones();
  }

  cargarMisPublicaciones() {
    this.cargandoPublicaciones.set(true);
    this.http.get<Producto[]>(`${environment.apiUrl}/productos/vendedor/1`).subscribe({
      next: (prods) => {
        this.misPublicaciones.set(prods || []);
        this.cargandoPublicaciones.set(false);
      },
      error: () => {
        this.cargandoPublicaciones.set(false);
      }
    });
  }

  eliminarPublicacion(id: number) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta publicación?')) {
      return;
    }

    this.http.delete(`${environment.apiUrl}/productos/${id}`).subscribe({
      next: () => {
        this.misPublicaciones.update(lista => lista.filter(p => p.id !== id));
      },
      error: (err) => {
        alert(err?.error?.message || 'No se pudo eliminar la publicación.');
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.perfilForm.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched || this.isSubmitted());
  }

  onSubmit(): void {
    this.isSubmitted.set(true);

    if (this.perfilForm.invalid) {
      this.perfilForm.markAllAsTouched();
      return;
    }

    const formValues = this.perfilForm.getRawValue();

    this.estudiante.update(actual => ({
      ...actual,
      nombre: formValues.nombre,
      telefono: formValues.telefono,
      carrera: formValues.carrera,
      campus: formValues.campus,
      bio: formValues.bio
    }));

    this.guardadoExitoso.set(true);
    this.isSubmitted.set(false);

    setTimeout(() => {
      this.guardadoExitoso.set(false);
    }, 4000);
  }
}
