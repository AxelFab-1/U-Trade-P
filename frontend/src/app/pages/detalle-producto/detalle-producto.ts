import { Component, OnInit, OnDestroy, signal, computed, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProductoService } from '../../core/services/producto.service';
import { PedidoService } from '../../core/services/pedido.service';
import { StockSseService } from '../../core/services/stock-sse.service';
import { Producto } from '../../core/models/producto.model';
import { PagoYapeResponse } from '../../core/models/pedido.model';
import { AuthService } from '../../core/services/auth.service';
import { FavoritoService } from '../../core/services/favorito.service';
import { ReporteService } from '../../core/services/reporte.service';
import { formatearTiempoRelativo } from '../../core/utils/tiempo-relativo.util';
import { imprimirComprobante } from '../../core/utils/comprobante-printer.util';
import { coordinarEntregaWhatsApp } from '../../core/utils/whatsapp.util';
import { ProductCard } from '../../components/product-card/product-card';

@Component({
  selector: 'app-detalle-producto',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ProductCard],
  templateUrl: './detalle-producto.html',
  styleUrl: './detalle-producto.scss',
})
export class DetalleProducto implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly productoService = inject(ProductoService);
  private readonly pedidoService = inject(PedidoService);
  private readonly stockSseService = inject(StockSseService);
  public readonly authService = inject(AuthService);
  public readonly favoritoService = inject(FavoritoService);
  private readonly reporteService = inject(ReporteService);
  private readonly cdr = inject(ChangeDetectorRef);

  private sseSubscription?: Subscription;
  private paramMapSubscription?: Subscription;

  readonly producto = signal<Producto | undefined>(undefined);
  readonly productosRelacionados = signal<Producto[]>([]);
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

  // Modal de Reporte de Publicación
  readonly modalReporteAbierto = signal<boolean>(false);
  readonly motivoReporte = signal<string>('Producto prohibido o regulado');
  readonly detalleReporte = signal<string>('');
  readonly enviandoReporte = signal<boolean>(false);
  readonly errorReporte = signal<string>('');
  readonly reporteExitoso = signal<boolean>(false);

  readonly motivosDisponibles = [
    'Producto prohibido o regulado',
    'Publicación falsa / estafa',
    'Contenido inapropiado',
    'Otro'
  ];

  // Estado de Compartir / Copiar Enlace
  readonly enlaceCopiado = signal<boolean>(false);
  private copyTimeout?: any;

  readonly tiempoPublicacion = computed(() => formatearTiempoRelativo(this.producto()?.fechaPublicacion));
  readonly esComida = computed(() => this.producto()?.categoria === 'Comida');
  readonly esFavorito = computed(() => {
    const prod = this.producto();
    if (!prod || !prod.id) return false;
    return this.favoritoService.esFavorito(prod.id);
  });
  
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
    if (prod.disponible === false && (prod.stock === undefined || prod.stock <= 0)) return true;
    return false;
  });

  readonly totalPagar = computed(() => {
    const prod = this.producto();
    if (!prod) return 0;
    const qty = this.tieneStockMultiple() ? this.cantidad() : 1;
    return Number((prod.precio * qty).toFixed(2));
  });

  ngOnInit() {
    this.paramMapSubscription = this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        const id = parseInt(idParam, 10);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.cargarDetalle(id);
      } else {
        this.cargando.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy() {
    this.paramMapSubscription?.unsubscribe();
    this.desconectarSse();
    if (this.copyTimeout) {
      clearTimeout(this.copyTimeout);
    }
  }

  private conectarSse(productoId: number): void {
    this.desconectarSse();
    this.sseSubscription = this.stockSseService.conectar(productoId).subscribe({
      next: (update) => {
        this.producto.update((actual) => {
          if (!actual || actual.id !== update.productoId) return actual;
          return {
            ...actual,
            stock: update.stock,
            disponible: update.disponible
          };
        });

        // Ajustar cantidad si el nuevo stock es menor a lo que tenía seleccionado
        if (this.cantidad() > update.stock) {
          this.cantidad.set(Math.max(1, update.stock));
        }

        // Si el producto se agotó mientras tenía abierto el modal de pago
        if (update.stock <= 0 || !update.disponible) {
          if (this.modalYapeAbierto() && !this.voucherExitoso()) {
            this.errorYape.set('⚠️ Stock agotado: Otro usuario acaba de comprar esta publicación.');
          }
        }

        this.cdr.markForCheck();
      },
      error: (err) => {
        console.warn('Error en canal de stock SSE:', err);
      }
    });
  }

  private desconectarSse(): void {
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
      this.sseSubscription = undefined;
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
    this.errorCompra.set('');
    this.productoService.getProductoById(id).subscribe({
      next: (prod) => {
        this.producto.set(prod);
        this.cargando.set(false);
        this.cantidad.set(1);
        this.conectarSse(id);
        this.cargarRelacionados(prod);
        this.cdr.markForCheck();
      },
      error: () => {
        this.producto.set(undefined);
        this.productosRelacionados.set([]);
        this.cargando.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  private cargarRelacionados(prod: Producto): void {
    if (!prod || !prod.categoria) {
      this.productosRelacionados.set([]);
      return;
    }

    this.productoService.buscarProductos(undefined, prod.categoria).subscribe({
      next: (lista) => {
        const filtrados = (lista || [])
          .filter(p => p.id !== prod.id && (p.disponible === undefined || p.disponible) && (!p.stock || p.stock > 0) && !p.comprador)
          .slice(0, 4);
        this.productosRelacionados.set(filtrados);
        this.cdr.markForCheck();
      },
      error: () => {
        this.productosRelacionados.set([]);
        this.cdr.markForCheck();
      }
    });
  }

  irADetalle(id: number): void {
    this.router.navigate(['/producto', id]);
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

        if (err?.status === 409) {
          const msgServidor = err?.error?.message || err?.error;
          const mensajeFinal = typeof msgServidor === 'string' && msgServidor.length > 0 
            ? `⚠️ ${msgServidor}` 
            : '⚠️ Stock agotado: Otro usuario completó la compra justo antes. No se realizó ningún cargo.';
          this.errorYape.set(mensajeFinal);
          // Actualizar inmediatamente a agotado
          this.producto.update(p => p ? { ...p, stock: 0, disponible: false } : p);
        } else {
          const msg = err?.error?.message || err?.error || 'No se pudo procesar el pago con Yape. Verifica tus datos.';
          this.errorYape.set(typeof msg === 'string' ? msg : 'Error de comunicación con la pasarela Yape.');
        }

        this.cdr.markForCheck();
      }
    });
  }

  contactarWhatsApp() {
    const prod = this.producto();
    if (!prod) return;

    // Protección de Privacidad: exigir inicio de sesión
    if (!this.authService.isAuthenticated()) {
      this.errorCompra.set('🔒 Debes iniciar sesión con tu cuenta institucional UTP para contactar al vendedor por WhatsApp.');
      this.cdr.markForCheck();
      return;
    }

    const vendedor = prod.vendedor;
    const tel = vendedor?.telefono?.trim();

    if (!tel) {
      this.errorCompra.set(`El vendedor no ha registrado un número de celular. Puedes contactarlo a su correo institucional: ${vendedor?.correo || 'correo UTP'}`);
      this.cdr.markForCheck();
      return;
    }

    // 1. Limpieza estricta del número: solo dígitos y prefijo peruano 51
    const telSoloDigitos = tel.replace(/\D/g, '');
    if (!telSoloDigitos) {
      this.errorCompra.set('El número de teléfono del vendedor no tiene un formato válido.');
      this.cdr.markForCheck();
      return;
    }
    const celularFinal = telSoloDigitos.startsWith('51') ? telSoloDigitos : `51${telSoloDigitos}`;

    // 2. Mensaje prellenado dinámico y codificado de forma segura con encodeURIComponent
    const primerNombre = vendedor?.nombre ? vendedor.nombre.trim().split(/\s+/)[0] : '';
    const saludo = primerNombre ? `¡Hola ${primerNombre}!` : '¡Hola!';
    const precio = Number(prod.precio).toFixed(2);
    const mensajeTexto = `${saludo} Vi tu publicación de "${prod.nombre}" en U-Market a S/ ${precio}. ¿Sigue disponible para coordinar la entrega en campus?`;
    const mensajeCodificado = encodeURIComponent(mensajeTexto);

    window.open(`https://wa.me/${celularFinal}?text=${mensajeCodificado}`, '_blank');
  }

  imprimirVoucher() {
    const v = this.voucherExitoso();
    const prod = this.producto();
    if (!v || !prod) return;

    imprimirComprobante({
      numeroTransaccion: v.numeroTransaccion,
      productoNombre: v.nombreProducto,
      cantidad: v.cantidad,
      montoTotal: v.montoTotal,
      vendedorNombre: prod.vendedor?.nombre || 'Estudiante UTP',
      compradorNombre: this.authService.getNombreUsuario() || 'Estudiante UTP',
      celularComprador: this.celularYape(),
      fecha: new Date(),
      metodoPago: 'Yape'
    });
  }

  coordinarEntregaPostPago(): void {
    const v = this.voucherExitoso();
    const prod = this.producto();
    if (!v) return;

    const tel = v.vendedorTelefono || prod?.vendedor?.telefono;
    const nombre = v.vendedorNombre || prod?.vendedor?.nombre;

    if (!tel) {
      this.errorCompra.set('El vendedor no tiene un número de celular registrado.');
      this.cdr.markForCheck();
      return;
    }

    coordinarEntregaWhatsApp({
      vendedorTelefono: tel,
      vendedorNombre: nombre,
      monto: v.montoTotal,
      numeroOperacion: v.numeroTransaccion,
      nombreProducto: v.nombreProducto
    });
  }

  async compartirProducto(): Promise<void> {
    const prod = this.producto();
    const url = window.location.href;
    const title = prod ? prod.nombre : 'U-Market UTP';
    const text = prod ? `Mira esto en U-Market: ${prod.nombre}` : 'Mira este producto en U-Market';

    // 1. Web Share API nativa (móviles y navegadores modernos)
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return;
        }
      }
    }

    // 2. Copia al portapapeles (escritorio y fallback seguro)
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      this.enlaceCopiado.set(true);
      this.cdr.markForCheck();

      if (this.copyTimeout) {
        clearTimeout(this.copyTimeout);
      }
      this.copyTimeout = setTimeout(() => {
        this.enlaceCopiado.set(false);
        this.cdr.markForCheck();
      }, 2500);
    } catch (e) {
      console.error('Error al copiar enlace del producto:', e);
    }
  }

  onToggleFavorito(): void {
    const prod = this.producto();
    if (!prod || !prod.id) return;

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.favoritoService.toggleFavorito(prod.id).subscribe({
      next: () => {
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al alternar favorito:', err);
      }
    });
  }

  // --- REPORTES / DENUNCIAS DE PUBLICACIÓN ---
  abrirModalReporte(): void {
    this.motivoReporte.set('Producto prohibido o regulado');
    this.detalleReporte.set('');
    this.errorReporte.set('');
    this.reporteExitoso.set(false);
    this.modalReporteAbierto.set(true);
    this.cdr.markForCheck();
  }

  cerrarModalReporte(): void {
    this.modalReporteAbierto.set(false);
    this.cdr.markForCheck();
  }

  enviarReporte(): void {
    const prodId = this.producto()?.id;
    if (!prodId) return;

    this.enviandoReporte.set(true);
    this.errorReporte.set('');
    this.cdr.markForCheck();

    this.reporteService.crearReporte({
      productoId: prodId,
      motivo: this.motivoReporte(),
      detalle: this.detalleReporte() ? this.detalleReporte().trim() : undefined
    }).subscribe({
      next: () => {
        this.enviandoReporte.set(false);
        this.reporteExitoso.set(true);
        this.cdr.markForCheck();
        setTimeout(() => {
          this.cerrarModalReporte();
        }, 1800);
      },
      error: (err) => {
        this.enviandoReporte.set(false);
        const msg = err?.error?.message || err?.error || 'No se pudo enviar el reporte.';
        this.errorReporte.set(typeof msg === 'string' ? msg : 'Error al enviar reporte.');
        this.cdr.markForCheck();
      }
    });
  }
}
