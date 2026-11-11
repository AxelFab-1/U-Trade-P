import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ProductoService } from '../../core/services/producto.service';

@Component({
  selector: 'app-publicar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './publicar.html',
  styleUrl: './publicar.scss',
})
export class Publicar implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly productoService = inject(ProductoService);

  // Estados de validación de perfil previo a publicar
  readonly cargandoPerfil = signal<boolean>(true);
  readonly perfilCompleto = signal<boolean>(false);
  readonly datosFaltantes = signal<string[]>([]);

  readonly isSubmitted = signal<boolean>(false);
  readonly publicacionExitosa = signal<boolean>(false);
  readonly errorPublicacion = signal<string>('');
  readonly guardando = signal<boolean>(false);
  readonly fotoUrl = signal<string>('');
  readonly productoCreadoId = signal<number | null>(null);

  // 'UNICO' (1 sola unidad) o 'STOCK' (múltiples unidades con contador)
  readonly tipoInventario = signal<'UNICO' | 'STOCK'>('UNICO');

  // Formulario Reactivo con FormBuilder y Validators (Requisito Unidad 3 - Semana 13)
  readonly publicarForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    categoria: ['', [Validators.required]],
    precio: [null, [Validators.required, Validators.min(0.01)]],
    stock: [1, [Validators.required, Validators.min(1)]],
    descripcion: ['', [Validators.required, Validators.minLength(10)]],
    foto: ['']
  });

  ngOnInit(): void {
    this.verificarPerfil();
  }

  verificarPerfil(): void {
    this.cargandoPerfil.set(true);
    this.http.get<any>(`${environment.apiUrl}/auth/perfil`).subscribe({
      next: (perfil) => {
        const tel = perfil?.telefono?.trim();
        const camp = perfil?.campus?.trim();
        const carr = perfil?.carrera?.trim();

        const faltantes: string[] = [];
        if (!tel) faltantes.push('Teléfono celular de contacto');
        if (!camp) faltantes.push('Campus UTP');
        if (!carr) faltantes.push('Carrera profesional');

        this.datosFaltantes.set(faltantes);
        this.perfilCompleto.set(faltantes.length === 0);
        this.cargandoPerfil.set(false);
      },
      error: () => {
        this.perfilCompleto.set(false);
        this.datosFaltantes.set(['Teléfono celular de contacto', 'Campus UTP', 'Carrera profesional']);
        this.cargandoPerfil.set(false);
      }
    });
  }

  setTipoInventario(tipo: 'UNICO' | 'STOCK'): void {
    this.tipoInventario.set(tipo);
    if (tipo === 'UNICO') {
      this.publicarForm.patchValue({ stock: 1 });
    } else {
      const stockActual = this.publicarForm.get('stock')?.value;
      if (!stockActual || stockActual <= 1) {
        this.publicarForm.patchValue({ stock: 5 });
      }
    }
  }

  ajustarStock(delta: number): void {
    const actual = Number(this.publicarForm.get('stock')?.value) || 1;
    const nuevo = Math.max(1, actual + delta);
    this.publicarForm.patchValue({ stock: nuevo });
  }

  onFotoInput(valor: string): void {
    this.fotoUrl.set(valor.trim());
  }

  onSubmit(): void {
    this.isSubmitted.set(true);
    this.errorPublicacion.set('');

    if (!this.perfilCompleto()) {
      this.errorPublicacion.set('Debes completar tus datos en tu perfil antes de publicar.');
      return;
    }

    if (this.publicarForm.invalid) {
      this.publicarForm.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const formVal = this.publicarForm.getRawValue();
    const stockFinal = this.tipoInventario() === 'UNICO' ? 1 : Math.max(1, Number(formVal.stock) || 1);

    const nuevoProducto = {
      nombre: formVal.nombre.trim(),
      categoria: formVal.categoria,
      precio: Number(formVal.precio),
      stock: stockFinal,
      descripcion: formVal.descripcion.trim(),
      foto: formVal.foto?.trim() || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&q=80'
    };

    // CRUD mediante servicio centralizado (Requisito Unidad 3 - Semana 14)
    this.productoService.crearProducto(nuevoProducto).subscribe({
      next: (creado) => {
        this.guardando.set(false);
        this.publicacionExitosa.set(true);
        this.productoCreadoId.set(creado?.id || null);
        this.publicarForm.reset({
          nombre: '',
          categoria: '',
          precio: null,
          stock: 1,
          descripcion: '',
          foto: ''
        });
        this.tipoInventario.set('UNICO');
        this.fotoUrl.set('');
        this.isSubmitted.set(false);
      },
      error: (err) => {
        this.guardando.set(false);
        if (err.status === 412) {
          this.perfilCompleto.set(false);
          this.verificarPerfil();
        }
        const msg = err?.error?.message || err?.error;
        this.errorPublicacion.set(typeof msg === 'string' ? msg : 'Error al registrar la publicación. Verifica los datos.');
      }
    });
  }

  irAPublicacion(): void {
    const id = this.productoCreadoId();
    if (id) {
      this.router.navigate(['/producto', id]);
    } else {
      this.router.navigate(['/explorar']);
    }
  }

  nuevaPublicacion(): void {
    this.publicacionExitosa.set(false);
    this.productoCreadoId.set(null);
  }
}
