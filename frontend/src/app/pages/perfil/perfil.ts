import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Producto } from '../../core/models/producto.model';
import { Pedido } from '../../core/models/pedido.model';
import { AuthService } from '../../core/services/auth.service';
import { PedidoService } from '../../core/services/pedido.service';

export interface PerfilEstudiante {
  nombre: string;
  correo: string;
  telefono: string;
  carrera: string;
  campus: string;
  bio: string;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly pedidoService = inject(PedidoService);

  readonly tabActiva = signal<'datos' | 'compras' | 'ventas' | 'publicaciones'>('datos');
  readonly vieneDePublicar = signal<boolean>(false);

  readonly estudiante = signal<PerfilEstudiante>({
    nombre: '',
    correo: '',
    telefono: '',
    carrera: '',
    campus: '',
    bio: ''
  });

  readonly guardadoExitoso = signal(false);
  readonly isSubmitted = signal(false);
  
  // Publicaciones
  readonly misPublicaciones = signal<Producto[]>([]);
  readonly cargandoPublicaciones = signal(false);

  // Compras y Ventas Yape
  readonly misCompras = signal<Pedido[]>([]);
  readonly cargandoCompras = signal(false);
  readonly misVentas = signal<Pedido[]>([]);
  readonly cargandoVentas = signal(false);

  // Modal para ver comprobante digital
  readonly pedidoSeleccionado = signal<Pedido | null>(null);

  // Edición de Publicaciones
  readonly publicacionEnEdicion = signal<Producto | null>(null);
  readonly guardandoEdicion = signal<boolean>(false);
  readonly errorEdicion = signal<string>('');

  readonly editForm: FormGroup = this.fb.group({
    id: [null],
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    categoria: ['', [Validators.required]],
    precio: [null, [Validators.required, Validators.min(0.01)]],
    stock: [1, [Validators.required, Validators.min(0)]],
    descripcion: ['', [Validators.required, Validators.minLength(10)]],
    foto: [''],
    disponible: [true]
  });

  readonly perfilForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    correo: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],
    carrera: ['', [Validators.required]],
    campus: ['', [Validators.required]],
    bio: ['', [Validators.maxLength(200)]]
  });

  ngOnInit() {
    this.cargarDatosEstudiante();
    this.cargarMisPublicaciones();
    this.cargarMisCompras();
    this.cargarMisVentas();

    const tabParam = this.route.snapshot.queryParamMap.get('tab');
    if (tabParam === 'compras' || tabParam === 'ventas' || tabParam === 'publicaciones') {
      this.tabActiva.set(tabParam);
    }

    const origenParam = this.route.snapshot.queryParamMap.get('origen');
    if (origenParam === 'publicar') {
      this.vieneDePublicar.set(true);
    }
  }

  setTab(tab: 'datos' | 'compras' | 'ventas' | 'publicaciones') {
    this.tabActiva.set(tab);
    if (tab === 'compras') this.cargarMisCompras();
    if (tab === 'ventas') this.cargarMisVentas();
    if (tab === 'publicaciones') this.cargarMisPublicaciones();
  }

  obtenerIniciales(): string {
    const nom = this.estudiante().nombre?.trim();
    if (!nom) return 'U';
    const partes = nom.split(/\s+/).filter(Boolean);
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return nom.substring(0, 2).toUpperCase();
  }

  cargarDatosEstudiante() {
    const correoAuth = this.authService.getCorreoUsuario();
    if (!correoAuth) return;

    const storageKey = 'umarket_profile_' + correoAuth.toLowerCase();
    const guardado = localStorage.getItem(storageKey);
    let datosLocales: any = null;
    if (guardado) {
      try {
        datosLocales = JSON.parse(guardado);
      } catch {}
    }

    // Consulta perfil al backend para obtener los datos oficiales
    this.http.get<any>(`${environment.apiUrl}/auth/perfil`).subscribe({
      next: (perfilDb) => {
        const nombreReal = perfilDb.nombre || datosLocales?.nombre || correoAuth.split('@')[0];
        const telReal = perfilDb.telefono || datosLocales?.telefono || '';
        const campusReal = perfilDb.campus || datosLocales?.campus || '';
        const carreraReal = perfilDb.carrera || datosLocales?.carrera || '';

        const datos: PerfilEstudiante = {
          nombre: nombreReal,
          correo: perfilDb.correo || correoAuth,
          telefono: telReal,
          carrera: carreraReal,
          campus: campusReal,
          bio: datosLocales?.bio || ''
        };
        this.estudiante.set(datos);
        this.perfilForm.patchValue({
          nombre: datos.nombre,
          correo: datos.correo,
          telefono: datos.telefono,
          carrera: datos.carrera,
          campus: datos.campus,
          bio: datos.bio
        });
      },
      error: () => {
        const datos: PerfilEstudiante = {
          nombre: datosLocales?.nombre || correoAuth.split('@')[0],
          correo: correoAuth,
          telefono: datosLocales?.telefono || '',
          carrera: datosLocales?.carrera || '',
          campus: datosLocales?.campus || '',
          bio: datosLocales?.bio || ''
        };
        this.estudiante.set(datos);
        this.perfilForm.patchValue({
          nombre: datos.nombre,
          correo: datos.correo,
          telefono: datos.telefono,
          carrera: datos.carrera,
          campus: datos.campus,
          bio: datos.bio
        });
      }
    });
  }

  cargarMisPublicaciones() {
    this.cargandoPublicaciones.set(true);
    this.http.get<Producto[]>(`${environment.apiUrl}/productos`).subscribe({
      next: (prods) => {
        const correo = this.authService.getCorreoUsuario();
        const filtrados = (prods || []).filter(p => p.vendedor?.correo?.toLowerCase() === correo?.toLowerCase());
        this.misPublicaciones.set(filtrados);
        this.cargandoPublicaciones.set(false);
      },
      error: () => {
        this.cargandoPublicaciones.set(false);
      }
    });
  }

  cargarMisCompras() {
    this.cargandoCompras.set(true);
    this.pedidoService.getMisCompras().subscribe({
      next: (pedidos) => {
        this.misCompras.set(pedidos || []);
        this.cargandoCompras.set(false);
      },
      error: () => {
        this.misCompras.set([]);
        this.cargandoCompras.set(false);
      }
    });
  }

  cargarMisVentas() {
    this.cargandoVentas.set(true);
    this.pedidoService.getMisVentas().subscribe({
      next: (pedidos) => {
        this.misVentas.set(pedidos || []);
        this.cargandoVentas.set(false);
      },
      error: () => {
        this.misVentas.set([]);
        this.cargandoVentas.set(false);
      }
    });
  }

  abrirComprobante(pedido: Pedido) {
    this.pedidoSeleccionado.set(pedido);
  }

  cerrarComprobante() {
    this.pedidoSeleccionado.set(null);
  }

  eliminarPublicacion(id: number) {
    if (!confirm('¿Deseas eliminar esta publicación?')) {
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

  toggleDisponibilidad(producto: Producto): void {
    const nuevoEstado = producto.disponible === false ? true : false;
    this.http.patch<Producto>(`${environment.apiUrl}/productos/${producto.id}/disponibilidad`, { disponible: nuevoEstado }).subscribe({
      next: (actualizado) => {
        this.misPublicaciones.update(lista =>
          lista.map(p => p.id === producto.id ? { ...p, disponible: actualizado.disponible } : p)
        );
      },
      error: (err) => {
        alert(err?.error?.message || err?.error || 'No se pudo cambiar el estado de la publicación.');
      }
    });
  }

  abrirEditarPublicacion(producto: Producto): void {
    this.publicacionEnEdicion.set(producto);
    this.errorEdicion.set('');
    this.editForm.reset({
      id: producto.id,
      nombre: producto.nombre,
      categoria: producto.categoria,
      precio: producto.precio,
      stock: producto.stock ?? 1,
      descripcion: producto.descripcion,
      foto: producto.foto || '',
      disponible: producto.disponible !== false
    });
  }

  cerrarEditarPublicacion(): void {
    this.publicacionEnEdicion.set(null);
    this.errorEdicion.set('');
  }

  isEditFieldInvalid(fieldName: string): boolean {
    const field = this.editForm.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  guardarEdicionPublicacion(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const id = this.editForm.get('id')?.value;
    if (!id) return;

    this.guardandoEdicion.set(true);
    this.errorEdicion.set('');

    const val = this.editForm.getRawValue();
    const payload = {
      nombre: val.nombre?.trim(),
      categoria: val.categoria,
      precio: Number(val.precio),
      stock: Number(val.stock) >= 0 ? Number(val.stock) : 1,
      descripcion: val.descripcion?.trim(),
      foto: val.foto?.trim() || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&q=80',
      disponible: val.disponible === true || val.disponible === 'true'
    };

    this.http.put<Producto>(`${environment.apiUrl}/productos/${id}`, payload).subscribe({
      next: (actualizado) => {
        this.guardandoEdicion.set(false);
        this.misPublicaciones.update(lista =>
          lista.map(p => (p.id === id ? { ...p, ...actualizado } : p))
        );
        this.cerrarEditarPublicacion();
      },
      error: (err) => {
        this.guardandoEdicion.set(false);
        const msg = err?.error?.message || err?.error;
        this.errorEdicion.set(typeof msg === 'string' ? msg : 'Error al actualizar la publicación.');
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

    // Guardar en la base de datos a través de PUT /api/auth/perfil
    this.http.put<any>(`${environment.apiUrl}/auth/perfil`, {
      nombre: formValues.nombre,
      telefono: formValues.telefono || '',
      campus: formValues.campus || '',
      carrera: formValues.carrera || ''
    }).subscribe({
      next: (res) => {
        const actualizado: PerfilEstudiante = {
          nombre: res.nombre || formValues.nombre,
          correo: res.correo || this.estudiante().correo,
          telefono: res.telefono || '',
          carrera: res.carrera || '',
          campus: res.campus || '',
          bio: formValues.bio || ''
        };

        this.estudiante.set(actualizado);

        const correoAuth = this.authService.getCorreoUsuario();
        if (correoAuth) {
          localStorage.setItem('umarket_profile_' + correoAuth.toLowerCase(), JSON.stringify(actualizado));
        }

        this.guardadoExitoso.set(true);
        this.isSubmitted.set(false);

        setTimeout(() => {
          this.guardadoExitoso.set(false);
        }, 4000);
      },
      error: () => {
        const actualizado: PerfilEstudiante = {
          nombre: formValues.nombre,
          correo: this.estudiante().correo,
          telefono: formValues.telefono || '',
          carrera: formValues.carrera || '',
          campus: formValues.campus || '',
          bio: formValues.bio || ''
        };

        this.estudiante.set(actualizado);

        const correoAuth = this.authService.getCorreoUsuario();
        if (correoAuth) {
          localStorage.setItem('umarket_profile_' + correoAuth.toLowerCase(), JSON.stringify(actualizado));
        }

        this.guardadoExitoso.set(true);
        this.isSubmitted.set(false);

        setTimeout(() => {
          this.guardadoExitoso.set(false);
        }, 4000);
      }
    });
  }
}
