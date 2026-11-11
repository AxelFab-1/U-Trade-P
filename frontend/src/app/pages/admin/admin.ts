import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { UsuarioService } from '../../core/services/usuario.service';
import { ProductoService } from '../../core/services/producto.service';
import { AuthService } from '../../core/services/auth.service';
import { Usuario } from '../../core/models/usuario.model';
import { Producto } from '../../core/models/producto.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.scss'
})
export class Admin implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly productoService = inject(ProductoService);
  readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  // Pestaña activa ('usuarios' | 'productos' | 'nuevo-admin')
  readonly pestanaActiva = signal<'usuarios' | 'productos' | 'nuevo-admin'>('usuarios');

  // Signals para Gestión de Usuarios (Master-Detail)
  readonly usuarios = signal<Usuario[]>([]);
  readonly usuarioSeleccionado = signal<Usuario | null>(null);
  readonly cargandoUsuarios = signal<boolean>(false);
  readonly filtroUsuario = signal<string>('');

  // Signals para Moderación de Productos
  readonly productos = signal<Producto[]>([]);
  readonly cargandoProductos = signal<boolean>(false);
  readonly filtroProducto = signal<string>('');

  // Notificaciones y alertas
  readonly mensajeExito = signal<string>('');
  readonly mensajeError = signal<string>('');
  readonly guardandoAdmin = signal<boolean>(false);

  // Formulario Reactivo para Nuevo Administrador
  readonly adminForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{3,60}$/)]],
    correo: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@utp\.edu\.pe$/i)]],
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

  // Lista filtrada de productos
  readonly productosFiltrados = computed(() => {
    const q = this.filtroProducto().toLowerCase().trim();
    if (!q) return this.productos();
    return this.productos().filter(p => 
      p.nombre.toLowerCase().includes(q) || 
      p.categoria.toLowerCase().includes(q) ||
      (p.vendedor?.nombre && p.vendedor.nombre.toLowerCase().includes(q))
    );
  });

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarProductos();
  }

  cambiarPestana(pestana: 'usuarios' | 'productos' | 'nuevo-admin'): void {
    this.pestanaActiva.set(pestana);
    this.limpiarMensajes();
  }

  limpiarMensajes(): void {
    this.mensajeExito.set('');
    this.mensajeError.set('');
  }

  // --- GESTIÓN DE USUARIOS (MASTER-DETAIL) ---
  cargarUsuarios(): void {
    this.cargandoUsuarios.set(true);
    this.usuarioService.listar().subscribe({
      next: (data) => {
        this.usuarios.set(data);
        this.cargandoUsuarios.set(false);
        // Si no hay seleccionado o el seleccionado ya no existe, seleccionar el primero
        if (data.length > 0 && !this.usuarioSeleccionado()) {
          this.usuarioSeleccionado.set(data[0]);
        }
      },
      error: (err) => {
        this.cargandoUsuarios.set(false);
        this.mensajeError.set('Error al cargar la lista de usuarios desde el servidor.');
      }
    });
  }

  seleccionarUsuario(u: Usuario): void {
    this.usuarioSeleccionado.set(u);
    this.limpiarMensajes();
  }

  eliminarUsuario(u: Usuario): void {
    if (!u.id) return;

    if (u.correo.toLowerCase() === this.authService.currentUserEmail()?.toLowerCase()) {
      this.mensajeError.set('No puedes eliminar tu propia cuenta de administrador.');
      return;
    }

    const confirmacion = confirm(`¿Estás seguro de eliminar al usuario "${u.nombre}" (${u.correo})?\nSe eliminarán sus publicaciones indebidas y se protegerán las compras de otros estudiantes.`);
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
        // Refrescar también productos en caso se hayan eliminado los del usuario
        this.cargarProductos();
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error || 'Error al eliminar el usuario.';
        this.mensajeError.set(typeof msg === 'string' ? msg : 'Error al eliminar el usuario.');
      }
    });
  }

  // --- MODERACIÓN DE PRODUCTOS ---
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

    const confirmacion = confirm(`¿Estás seguro de dar de baja la publicación "${p.nombre}"?`);
    if (!confirmacion) return;

    this.limpiarMensajes();
    this.productoService.eliminarProducto(p.id).subscribe({
      next: () => {
        this.mensajeExito.set(`Publicación "${p.nombre}" eliminada del catálogo por moderación.`);
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
      return;
    }

    this.limpiarMensajes();
    this.guardandoAdmin.set(true);

    const formVal = this.adminForm.value;
    this.usuarioService.crearAdmin({
      nombre: formVal.nombre.trim(),
      correo: formVal.correo.trim().toLowerCase(),
      password: formVal.password
    }).subscribe({
      next: (nuevoAdmin) => {
        this.guardandoAdmin.set(false);
        this.mensajeExito.set(`¡Administrador "${nuevoAdmin.nombre}" creado exitosamente!`);
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
}
