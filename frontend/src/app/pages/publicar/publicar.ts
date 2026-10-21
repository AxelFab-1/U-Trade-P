import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-publicar',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './publicar.html',
  styleUrl: './publicar.scss',
})
export class Publicar {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);

  readonly isSubmitted = signal(false);
  readonly publicacionExitosa = signal(false);
  readonly errorPublicacion = signal('');
  readonly guardando = signal(false);

  readonly publicarForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    categoria: ['', [Validators.required]],
    precio: [null, [Validators.required, Validators.min(0.01)]],
    descripcion: ['', [Validators.required, Validators.minLength(10)]],
    foto: ['']
  });

  isFieldInvalid(fieldName: string): boolean {
    const field = this.publicarForm.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched || this.isSubmitted());
  }

  onSubmit(): void {
    this.isSubmitted.set(true);
    this.errorPublicacion.set('');

    if (this.publicarForm.invalid) {
      this.publicarForm.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const formVal = this.publicarForm.value;
    const nuevoProducto = {
      nombre: formVal.nombre,
      categoria: formVal.categoria,
      precio: formVal.precio,
      descripcion: formVal.descripcion,
      foto: formVal.foto || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&q=80',
      vendedor: { id: 1 }
    };

    this.http.post(`${environment.apiUrl}/productos`, nuevoProducto).subscribe({
      next: () => {
        this.guardando.set(false);
        this.publicacionExitosa.set(true);
        this.publicarForm.reset();
        this.isSubmitted.set(false);

        setTimeout(() => {
          this.publicacionExitosa.set(false);
        }, 4000);
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorPublicacion.set(err?.error || 'Error al publicar producto. Inténtalo de nuevo.');
      }
    });
  }
}
