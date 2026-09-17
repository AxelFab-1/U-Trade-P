import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-publicar',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './publicar.html',
  styleUrl: './publicar.scss',
})
export class Publicar {
  private readonly fb = inject(FormBuilder);

  readonly isSubmitted = signal(false);
  readonly publicacionExitosa = signal(false);

  readonly publicarForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    categoria: ['', [Validators.required]],
    precio: [null, [Validators.required, Validators.min(0)]],
    descripcion: ['', [Validators.required, Validators.minLength(10)]],
    foto: ['']
  });

  isFieldInvalid(fieldName: string): boolean {
    const field = this.publicarForm.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched || this.isSubmitted());
  }

  onSubmit(): void {
    this.isSubmitted.set(true);

    if (this.publicarForm.invalid) {
      this.publicarForm.markAllAsTouched();
      return;
    }

    const nuevoProducto = this.publicarForm.value;
    console.log('Publicación registrada exitosamente:', nuevoProducto);

    this.publicacionExitosa.set(true);
    this.publicarForm.reset();
    this.isSubmitted.set(false);

    // Ocultar mensaje después de unos segundos
    setTimeout(() => {
      this.publicacionExitosa.set(false);
    }, 4000);
  }
}
