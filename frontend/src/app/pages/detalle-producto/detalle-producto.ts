import { Component, OnInit, signal, computed, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../core/services/producto.service';
import { PedidoService } from '../../core/services/pedido.service';
import { Producto } from '../../core/models/producto.model';
import { PagoYapeResponse } from '../../core/models/pedido.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-detalle-producto',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './detalle-producto.html',
  styleUrl: './detalle-producto.scss',
})
export class DetalleProducto implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly productoService = inject(ProductoService);
  private readonly pedidoService = inject(PedidoService);
  public readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly producto = signal<Producto | undefined>(undefined);
  readonly cargando = signal<boolean>(true);
  readonly errorCompra = signal<string>('');
  
  // Stock y Selección de Cantidad
  readonly cantidad = signal<number>(1);
  
  // Modal de Pasarela Yape
  readonly modalYapeAbierto = signal<boolean>(false);
  readonly celularYape = signal<string>('');
  readonly codigoYape = signal<string>('');
  readonly procesandoYape = signal<boolean>(false);
  readonly errorYape = signal<string>('');
  readonly voucherExitoso = signal<PagoYapeResponse | null>(null);

  readonly esComida = computed(() => this.producto()?.categoria === 'Comida');
  
  readonly esMiProducto = computed(() => {
    const prod = this.producto();
    if (!prod || !prod.vendedor) return false;
    const correoActual = this.authService.getCorreoUsuario()?.toLowerCase().trim();
    const correoVendedor = prod.vendedor.correo?.toLowerCase().trim();
    return !!correoActual && correoActual === correoVendedor;
  });

  readonly estaPausado = computed(() => {
    const prod = this.producto();
    if (!prod) return false;
    return prod.disponible === false && (prod.stock === undefined || prod.stock > 0) && !prod.comprador;
  });

  readonly tieneStockMultiple = computed(() => {
    const prod = this.producto();
    if (!prod) return false;
    return (prod.stock !== undefined && prod.stock > 1) || prod.categoria === 'Comida';
  });
  
  readonly stockDisponible = computed(() => {
    const prod = this.producto();
    if (!prod) return 0;
    if (prod.disponible === false) return 0;
    return prod.stock !== undefined ? prod.stock : 1;
  });

  readonly estaAgotado = computed(() => {
    const prod = this.producto();
    if (!prod) return true;
    if (prod.comprador !== undefined && prod.comprador !== null) return true;
    if (prod.stock !== undefined && prod.stock <= 0) return true;
    return false;
  });

  readonly totalPagar = computed(() => {
    const prod = this.producto();
    if (!prod) return 0;
    const qty = this.tieneStockMultiple() ? this.cantidad() : 1;
    return Number((prod.precio * qty).toFixed(2));
  });

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = parseInt(idParam, 10);
      this.cargarDetalle(id);
    } else {
      this.cargando.set(false);
      this.cdr.markForCheck();
    }
  }

  obtenerInicialesVendedor(): string {
    const nom = this.producto()?.vendedor?.nombre?.trim();
    if (!nom) return 'U';
    const partes = nom.split(/\s+/).filter(Boolean);
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return nom.substring(0, 2).toUpperCase();
  }

  cargarDetalle(id: number) {
    this.cargando.set(true);
    this.productoService.getProductoById(id).subscribe({
      next: (prod) => {
        this.producto.set(prod);
        this.cargando.set(false);
        this.cantidad.set(1);
        this.cdr.markForCheck();
      },
      error: () => {
        this.producto.set(undefined);
        this.cargando.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  volver() {
    this.location.back();
  }

  incrementarCantidad() {
    if (this.cantidad() < this.stockDisponible()) {
      this.cantidad.update(c => c + 1);
    }
  }

  decrementarCantidad() {
    if (this.cantidad() > 1) {
      this.cantidad.update(c => c - 1);
    }
  }

  abrirModalYape() {
    const prod = this.producto();
    if (!prod || !prod.id) return;

    if (this.esMiProducto()) {
      this.errorCompra.set('No puedes comprar tu propia publicación.');
      this.cdr.markForCheck();
      return;
    }

    if (this.estaPausado()) {
      this.errorCompra.set('El vendedor ha pausado la compra de este producto temporalmente (se encuentra en clase o fuera de campus).');
      this.cdr.markForCheck();
      return;
    }

    if (this.estaAgotado()) {
      this.errorCompra.set('Esta publicación ya fue vendida o se encuentra agotada.');
      this.cdr.markForCheck();
      return;
    }

    if (!this.authService.isAuthenticated()) {
      this.errorCompra.set('Debes iniciar sesión con tu cuenta UTP (@utp.edu.pe) para comprar con Yape.');
      this.cdr.markForCheck();
      return;
    }

    this.errorCompra.set('');
    this.errorYape.set('');
    this.voucherExitoso.set(null);
    this.celularYape.set('');
    this.codigoYape.set('');
    this.modalYapeAbierto.set(true);
    this.cdr.markForCheck();
  }

  cerrarModalYape() {
    this.modalYapeAbierto.set(false);
    this.voucherExitoso.set(null);
    this.errorYape.set('');
  }

  irAPerfilCompras() {
    this.cerrarModalYape();
    this.router.navigate(['/perfil'], { queryParams: { tab: 'compras' } });
  }

  ejecutarPagoYape() {
    const prod = this.producto();
    if (!prod || !prod.id) return;

    const celular = this.celularYape().trim();
    const codigo = this.codigoYape().trim();

    if (!celular.match(/^9\d{8}$/)) {
      this.errorYape.set('Ingresa un número de celular válido (9 dígitos comenzando con 9).');
      return;
    }

    if (!codigo.match(/^\d{6}$/)) {
      this.errorYape.set('El código de aprobación de Yape debe tener 6 dígitos numéricos.');
      return;
    }

    this.procesandoYape.set(true);
    this.errorYape.set('');

    const req = {
      productoId: prod.id,
      cantidad: this.tieneStockMultiple() ? this.cantidad() : 1,
      celular: celular,
      codigoAprobacion: codigo
    };

    this.pedidoService.procesarPagoYape(req).subscribe({
      next: (res) => {
        this.procesandoYape.set(false);
        this.voucherExitoso.set(res);

        // Actualizar el estado local del producto
        const p = { ...prod };
        if (this.tieneStockMultiple()) {
          const nuevoStock = Math.max(0, (p.stock ?? 1) - res.cantidad);
          p.stock = nuevoStock;
          if (nuevoStock === 0) {
            p.disponible = false;
          }
        } else {
          p.stock = 0;
          p.disponible = false;
        }
        this.producto.set(p);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.procesandoYape.set(false);
        const msg = err?.error?.message || err?.error || 'No se pudo procesar el pago con Yape. Verifica tus datos.';
        this.errorYape.set(typeof msg === 'string' ? msg : 'Error de comunicación con la pasarela Yape.');
        this.cdr.markForCheck();
      }
    });
  }

  contactarWhatsApp() {
    const prod = this.producto();
    if (!prod) return;
    const mensaje = encodeURIComponent(`Hola! Vi tu publicación de "${prod.nombre}" en U-Market y me gustaría coordinar la entrega.`);
    window.open(`https://wa.me/51987654321?text=${mensaje}`, '_blank');
  }

  contactarChat() {
    this.router.navigate(['/mensajes']);
  }
}
