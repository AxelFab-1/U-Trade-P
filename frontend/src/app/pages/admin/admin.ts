import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { UsuarioService } from '../../core/services/usuario.service';
import { ProductoService } from '../../core/services/producto.service';
import { AuthService } from '../../core/services/auth.service';
import { Usuario } from '../../core/models/usuario.model';
import { Producto } from '../../core/models/producto.model';
import { Reporte } from '../../core/models/reporte.model';
import { ReporteService } from '../../core/services/reporte.service';
import { formatearTiempoRelativo } from '../../core/utils/tiempo-relativo.util';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './admin.html',
  styleUrl: './admin.scss'
})
export class Admin implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly productoService = inject(ProductoService);
  private readonly reporteService = inject(ReporteService);
  readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  // Pestaña activa ('usuarios' | 'productos' | 'reportes' | 'nuevo-admin')
  readonly pestanaActiva = signal<'usuarios' | 'productos' | 'reportes' | 'nuevo-admin'>('usuarios');

  // Signals para Gestión de Usuarios
  readonly usuarios = signal<Usuario[]>([]);
  readonly usuarioSeleccionado = signal<Usuario | null>(null);
  readonly cargandoUsuarios = signal<boolean>(false);
  readonly filtroUsuario = signal<string>('');

  // Signals para Moderación de Productos
  readonly productos = signal<Producto[]>([]);
  readonly cargandoProductos = signal<boolean>(false);
  readonly filtroProducto = signal<string>('');
  readonly filtroUsuarioPublicaciones = signal<Usuario | null>(null);
  readonly productoParaVistaRapida = signal<Producto | null>(null);

  // Signals para Moderación de Reportes
  readonly reportes = signal<Reporte[]>([]);
  readonly cargandoReportes = signal<boolean>(false);
  readonly filtroReporteEstado = signal<'TODOS' | 'PENDIENTE' | 'REVISADO' | 'DESCARTADO'>('TODOS');

  // Modal y controles de Suspensión de Usuarios
  readonly modalSuspensionAbierto = signal<boolean>(false);
  readonly diasSuspension = signal<number>(7);
  readonly motivoSuspensionInput = signal<string>('Infracción a las normas de convivencia');
  readonly guardandoSuspension = signal<boolean>(false);

  // Notificaciones y alertas
  readonly mensajeExito = signal<string>('');
  readonly mensajeError = signal<string>('');
  readonly guardandoAdmin = signal<boolean>(false);

  // Formulario Reactivo para Nuevo Administrador
  readonly adminForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  // Lista filtrada de usuarios
  readonly usuariosFiltrados = computed(() => {
    const q = this.filtroUsuario().toLowerCase().trim();
    if (!q) return this.usuarios();
    return this.usuarios().filter(u => 
      u.nombre.toLowerCase().includes(q) || 
      u.correo.toLowerCase().includes(q) ||
      (u.rol && u.rol.toLowerCase().includes(q))
    );
  });

  // Publicaciones del usuario seleccionado actualmente
  readonly publicacionesUsuarioSeleccionado = computed(() => {
    const user = this.usuarioSeleccionado();
    if (!user) return [];
    return this.productos().filter(p => 
      p.vendedor?.id === user.id || 
      (p.vendedor?.correo && p.vendedor.correo.toLowerCase() === user.correo.toLowerCase())
    );
  });

  // Lista filtrada de productos (con soporte para filtro por usuario seleccionado)
  readonly productosFiltrados = computed(() => {
    let list = this.productos();
    const userFiltro = this.filtroUsuarioPublicaciones();
    if (userFiltro) {
      list = list.filter(p => 
        p.vendedor?.id === userFiltro.id || 
        (p.vendedor?.correo && p.vendedor.correo.toLowerCase() === userFiltro.correo.toLowerCase())
      );
    }
    const q = this.filtroProducto().toLowerCase().trim();
    if (!q) return list;
    return list.filter(p => 
      p.nombre.toLowerCase().includes(q) || 
      p.categoria.toLowerCase().includes(q) ||
      (p.vendedor?.nombre && p.vendedor.nombre.toLowerCase().includes(q))
    );
  });

  // Conteo de reportes pendientes
  readonly reportesPendientesCount = computed(() => 
    this.reportes().filter(r => r.estado === 'PENDIENTE').length
  );

  // Lista filtrada de reportes
  readonly reportesFiltrados = computed(() => {
    const estado = this.filtroReporteEstado();
    if (estado === 'TODOS') return this.reportes();
    return this.reportes().filter(r => r.estado === estado);
  });

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarProductos();
    this.cargarReportes();
  }

  cambiarPestana(pestana: 'usuarios' | 'productos' | 'reportes' | 'nuevo-admin'): void {
    this.pestanaActiva.set(pestana);
    this.limpiarMensajes();
  }

  limpiarMensajes(): void {
    this.mensajeExito.set('');
    this.mensajeError.set('');
  }

  // --- GESTIÓN DE USUARIOS ---
  cargarUsuarios(): void {
    this.cargandoUsuarios.set(true);
    this.usuarioService.listar().subscribe({
      next: (data) => {
        this.usuarios.set(data);
        this.cargandoUsuarios.set(false);
        if (data.length > 0 && !this.usuarioSeleccionado()) {
          this.usuarioSeleccionado.set(data[0]);
        }
      },
      error: () => {
        this.cargandoUsuarios.set(false);
        this.mensajeError.set('Error al cargar la lista de usuarios.');
      }
    });
  }

  seleccionarUsuario(u: Usuario): void {
    this.usuarioSeleccionado.set(u);
    this.limpiarMensajes();

    // En pantallas móviles (< 992px), deslizar suavemente hacia el detalle del usuario
    if (typeof window !== 'undefined' && window.innerWidth < 992) {
      setTimeout(() => {
        document.getElementById('detalle-usuario-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }

  verPublicacionesDeUsuario(u: Usuario): void {
    this.filtroUsuarioPublicaciones.set(u);
    this.pestanaActiva.set('productos');
    this.limpiarMensajes();
  }

  limpiarFiltroUsuario(): void {
    this.filtroUsuarioPublicaciones.set(null);
  }

  eliminarUsuario(u: Usuario): void {
    if (!u.id) return;

    if (u.correo.toLowerCase() === this.authService.currentUserEmail()?.toLowerCase()) {
      this.mensajeError.set('No puedes eliminar tu propia cuenta de administrador.');
      return;
    }

    const confirmacion = confirm('¿Eliminar usuario?');
    if (!confirmacion) return;

    this.limpiarMensajes();
    this.usuarioService.eliminar(u.id).subscribe({
      next: () => {
        this.mensajeExito.set(`Usuario "${u.nombre}" eliminado correctamente.`);
        this.usuarios.update(lista => lista.filter(item => item.id !== u.id));
        if (this.usuarioSeleccionado()?.id === u.id) {
          const restantes = this.usuarios();
          this.usuarioSeleccionado.set(restantes.length > 0 ? restantes[0] : null);
        }
        this.cargarProductos();
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error || 'Error al eliminar el usuario.';
        this.mensajeError.set(typeof msg === 'string' ? msg : 'Error al eliminar el usuario.');
      }
    });
  }

  // --- PUBLICACIONES ---
  cargarProductos(): void {
    this.cargandoProductos.set(true);
    this.productoService.getProductos().subscribe({
      next: (data) => {
        this.productos.set(data);
        this.cargandoProductos.set(false);
      },
      error: () => {
        this.cargandoProductos.set(false);
      }
    });
  }

  eliminarProducto(p: Producto): void {
    if (!p.id) return;

    const confirmacion = confirm('¿Eliminar publicación?');
    if (!confirmacion) return;

    this.limpiarMensajes();
    this.productoService.eliminarProducto(p.id).subscribe({
      next: () => {
        this.mensajeExito.set(`Publicación "${p.nombre}" eliminada correctamente.`);
        this.productos.update(lista => lista.filter(item => item.id !== p.id));
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error || 'No se pudo eliminar el producto.';
        this.mensajeError.set(typeof msg === 'string' ? msg : 'No se pudo eliminar el producto.');
      }
    });
  }

  // --- CREAR NUEVO ADMINISTRADOR ---
  registrarAdmin(): void {
    if (this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      this.mensajeError.set('Por favor completa todos los campos requeridos correctamente.');
      return;
    }

    this.limpiarMensajes();
    this.guardandoAdmin.set(true);

    const formVal = this.adminForm.value;
    const nombre = formVal.nombre ? formVal.nombre.trim() : '';
    const correo = formVal.correo ? formVal.correo.trim().toLowerCase() : '';
    const password = formVal.password;

    this.usuarioService.crearAdmin({
      nombre,
      correo,
      password
    }).subscribe({
      next: (nuevoAdmin) => {
        this.guardandoAdmin.set(false);
        this.mensajeExito.set(`Administrador "${nuevoAdmin.nombre}" creado exitosamente.`);
        this.adminForm.reset();
        this.usuarios.update(lista => [nuevoAdmin, ...lista]);
        this.usuarioSeleccionado.set(nuevoAdmin);
        this.pestanaActiva.set('usuarios');
      },
      error: (err) => {
        this.guardandoAdmin.set(false);
        const msg = err?.error?.message || err?.error || 'Error al registrar administrador.';
        this.mensajeError.set(typeof msg === 'string' ? msg : 'Error al registrar administrador.');
      }
    });
  }

  // --- MODERACIÓN DE REPORTES ---
  cargarReportes(): void {
    this.cargandoReportes.set(true);
    this.reporteService.listarReportes().subscribe({
      next: (data) => {
        this.reportes.set(data);
        this.cargandoReportes.set(false);
      },
      error: () => {
        this.cargandoReportes.set(false);
      }
    });
  }

  marcarReporteRevisado(r: Reporte): void {
    this.reporteService.revisarReporte(r.id).subscribe({
      next: (actualizado) => {
        this.reportes.update(lista => lista.map(item => item.id === r.id ? actualizado : item));
        this.mensajeExito.set(`Reporte #${r.id} marcado como revisado.`);
      },
      error: () => {
        this.mensajeError.set('No se pudo actualizar el estado del reporte.');
      }
    });
  }

  descartarReporte(r: Reporte): void {
    this.reporteService.descartarReporte(r.id).subscribe({
      next: (actualizado) => {
        this.reportes.update(lista => lista.map(item => item.id === r.id ? actualizado : item));
        this.mensajeExito.set(`Reporte #${r.id} descartado.`);
      },
      error: () => {
        this.mensajeError.set('No se pudo descartar el reporte.');
      }
    });
  }

  eliminarProductoDesdeReporte(r: Reporte): void {
    if (!r.producto?.id) return;
    const confirmacion = confirm(`¿Eliminar la publicación reportada "${r.producto.nombre}"?`);
    if (!confirmacion) return;

    this.limpiarMensajes();
    this.productoService.eliminarProducto(r.producto.id).subscribe({
      next: () => {
        this.mensajeExito.set(`Publicación "${r.producto.nombre}" eliminada correctamente.`);
        this.productos.update(lista => lista.filter(item => item.id !== r.producto.id));
        this.cargarReportes();
      },
      error: () => {
        this.mensajeError.set('No se pudo eliminar el producto reportado.');
      }
    });
  }

  eliminarReporte(r: Reporte): void {
    if (!r.id) return;
    const confirmacion = confirm(`¿Eliminar el reporte #${r.id} del historial?`);
    if (!confirmacion) return;

    this.limpiarMensajes();
    this.reporteService.eliminarReporte(r.id).subscribe({
      next: () => {
        this.reportes.update(lista => lista.filter(item => item.id !== r.id));
        this.mensajeExito.set(`Reporte #${r.id} eliminado correctamente.`);
      },
      error: () => {
        this.mensajeError.set('No se pudo eliminar el reporte.');
      }
    });
  }

  abrirVistaRapida(p?: Producto | null): void {
    if (!p) return;
    this.productoParaVistaRapida.set(p);
  }

  cerrarVistaRapida(): void {
    this.productoParaVistaRapida.set(null);
  }

  formatearFechaRelativa(fecha?: string): string {
    return formatearTiempoRelativo(fecha);
  }

  // --- SUSPENSIÓN TEMPORAL DE USUARIOS ---
  abrirModalSuspension(): void {
    this.diasSuspension.set(7);
    this.motivoSuspensionInput.set('Infracción a las normas de convivencia');
    this.modalSuspensionAbierto.set(true);
  }

  cerrarModalSuspension(): void {
    this.modalSuspensionAbierto.set(false);
  }

  confirmarSuspension(): void {
    const user = this.usuarioSeleccionado();
    if (!user || !user.id) return;

    this.guardandoSuspension.set(true);
    this.usuarioService.suspender(user.id, this.diasSuspension(), this.motivoSuspensionInput()).subscribe({
      next: (actualizado) => {
        this.guardandoSuspension.set(false);
        this.usuarioSeleccionado.set(actualizado);
        this.usuarios.update(lista => lista.map(u => u.id === actualizado.id ? actualizado : u));
        this.cerrarModalSuspension();
        this.mensajeExito.set(`Usuario "${actualizado.nombre}" suspendido exitosamente.`);
      },
      error: (err) => {
        this.guardandoSuspension.set(false);
        const msg = err?.error?.message || err?.error || 'Error al suspender usuario.';
        this.mensajeError.set(typeof msg === 'string' ? msg : 'Error al suspender usuario.');
      }
    });
  }

  reactivarUsuario(u: Usuario): void {
    if (!u.id) return;
    const confirmacion = confirm(`¿Reactivar la cuenta de "${u.nombre}" inmediatamente?`);
    if (!confirmacion) return;

    this.limpiarMensajes();
    this.usuarioService.reactivar(u.id).subscribe({
      next: (actualizado) => {
        this.usuarioSeleccionado.set(actualizado);
        this.usuarios.update(lista => lista.map(item => item.id === actualizado.id ? actualizado : item));
        this.mensajeExito.set(`Cuenta de "${actualizado.nombre}" reactivada exitosamente.`);
      },
      error: () => {
        this.mensajeError.set('No se pudo reactivar la cuenta del usuario.');
      }
    });
  }

  isUsuarioSuspendido(u?: Usuario | null): boolean {
    if (!u || !u.suspendidoHasta) return false;
    return new Date(u.suspendidoHasta).getTime() > Date.now();
  }
}
