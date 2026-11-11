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
import { ProductoService } from '../../core/services/producto.service';

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
  private readonly productoService = inject(ProductoService);

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
  readonly tipoComprobante = signal<'compra' | 'venta'>('compra');

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

  readonly modoEdicion = signal<boolean>(false);

  readonly perfilForm: FormGroup = this.fb.group({
    nombre: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(3)]],
    correo: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
    telefono: [{ value: '', disabled: true }, [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],
    carrera: [{ value: '', disabled: true }, [Validators.required]],
    campus: [{ value: '', disabled: true }, [Validators.required]],
    bio: [{ value: '', disabled: true }, [Validators.maxLength(200)]]
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

  activarEdicion(): void {
    this.modoEdicion.set(true);
    this.perfilForm.get('nombre')?.enable();
    this.perfilForm.get('telefono')?.enable();
    this.perfilForm.get('carrera')?.enable();
    this.perfilForm.get('campus')?.enable();
    this.perfilForm.get('bio')?.enable();
  }

  desactivarEdicion(): void {
    this.modoEdicion.set(false);
    this.perfilForm.get('nombre')?.disable();
    this.perfilForm.get('telefono')?.disable();
    this.perfilForm.get('carrera')?.disable();
    this.perfilForm.get('campus')?.disable();
    this.perfilForm.get('bio')?.disable();
  }

  cancelarEdicion(): void {
    const est = this.estudiante();
    this.perfilForm.patchValue({
      nombre: est.nombre,
      telefono: est.telefono,
      carrera: est.carrera,
      campus: est.campus,
      bio: est.bio
    });
    this.desactivarEdicion();
  }

  setTab(tab: 'datos' | 'compras' | 'ventas' | 'publicaciones') {
    if (this.tabActiva() === 'datos' && tab !== 'datos' && this.modoEdicion()) {
      this.cancelarEdicion();
    }
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

    let datosLocales: any = null;
    const cacheLocal = localStorage.getItem('umarket_profile_' + correoAuth.toLowerCase());
    if (cacheLocal) {
      try {
        datosLocales = JSON.parse(cacheLocal);
      } catch (e) {
        console.warn('Error leyendo caché de perfil:', e);
      }
    }

    this.http.get<any>(`${environment.apiUrl}/auth/perfil`).subscribe({
      next: (perfilDb) => {
        const nombreReal = (perfilDb.nombre && perfilDb.nombre.trim().length > 0)
          ? perfilDb.nombre
          : (datosLocales?.nombre || correoAuth.split('@')[0]);

        const telReal = (perfilDb.telefono && perfilDb.telefono.trim().length > 0)
          ? perfilDb.telefono
          : (datosLocales?.telefono || '');

        const campusReal = (perfilDb.campus && perfilDb.campus.trim().length > 0)
          ? perfilDb.campus
          : (datosLocales?.campus || '');

        const carreraReal = (perfilDb.carrera && perfilDb.carrera.trim().length > 0)
          ? perfilDb.carrera
          : (datosLocales?.carrera || '');

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
    // Consumo de ProductoService.getProductos() (Requisito Unidad 3 - Semana 14)
    this.productoService.getProductos().subscribe({
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

  abrirComprobante(pedido: Pedido, tipo: 'compra' | 'venta') {
    this.tipoComprobante.set(tipo);
    this.pedidoSeleccionado.set(pedido);
  }

  cerrarComprobante() {
    this.pedidoSeleccionado.set(null);
  }

  esVentaModal(): boolean {
    const sel = this.pedidoSeleccionado();
    if (!sel) return false;
    if (this.tipoComprobante() === 'venta') return true;
    if (this.tabActiva() === 'ventas') return true;
    const correoAuth = this.authService.getCorreoUsuario();
    return !!correoAuth && sel.vendedor?.correo?.toLowerCase() === correoAuth.toLowerCase();
  }

  // DELETE mediante ProductoService (Requisito Unidad 3 - Semana 14)
  eliminarPublicacion(id: number) {
    if (!confirm('¿Deseas eliminar esta publicación de forma definitiva?')) {
      return;
    }

    this.productoService.eliminarProducto(id).subscribe({
      next: () => {
        this.misPublicaciones.update(lista => lista.filter(p => p.id !== id));
      },
      error: (err) => {
        console.error('Error al eliminar publicación:', err);
        const msg = err?.error?.message || (typeof err?.error === 'string' ? err.error : null) || 'No se pudo eliminar la publicación.';
        alert(msg);
      }
    });
  }

  estaAgotado(item: Producto): boolean {
    return Boolean(item.comprador || (item.stock !== undefined && item.stock !== null && item.stock <= 0));
  }

  estaPausado(item: Producto): boolean {
    return !this.estaAgotado(item) && item.disponible === false;
  }

  obtenerEstadoBadge(item: Producto): { texto: string; clase: string } {
    if (this.estaAgotado(item)) {
      return {
        texto: item.categoria === 'Comida' ? 'Agotado' : 'Vendido',
        clase: 'badge-agotado'
      };
    }
    if (this.estaPausado(item)) {
      return {
        texto: 'Pausado',
        clase: 'badge-paused'
      };
    }
    return {
      texto: 'Activo',
      clase: 'badge-available'
    };
  }

  toggleDisponibilidad(producto: Producto): void {
    if (this.estaAgotado(producto)) {
      alert('Esta publicación está agotada. Edita la publicación para reponer stock antes de activarla.');
      return;
    }
    const nuevoEstado = producto.disponible === false ? true : false;
    this.productoService.cambiarDisponibilidad(producto.id!, nuevoEstado).subscribe({
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

  // UPDATE / PUT mediante ProductoService (Requisito Unidad 3 - Semana 14)
  guardarEdicionPublicacion(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const id = this.editForm.get('id')?.value;
    if (!id) {
      this.errorEdicion.set('Identificador de publicación no válido.');
      return;
    }

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

    this.productoService.actualizarProducto(id, payload).subscribe({
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
        this.desactivarEdicion();

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
        this.desactivarEdicion();

        setTimeout(() => {
          this.guardadoExitoso.set(false);
        }, 4000);
      }
    });
  }
}
