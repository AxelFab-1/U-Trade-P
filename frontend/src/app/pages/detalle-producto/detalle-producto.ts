import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductoService } from '../../core/services/producto.service';
import { Producto } from '../../core/models/producto.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-detalle-producto',
  imports: [CommonModule, RouterModule],
  templateUrl: './detalle-producto.html',
  styleUrl: './detalle-producto.scss',
})
export class DetalleProducto implements OnInit {
  producto: Producto | undefined;
  cargando: boolean = true;
  procesandoCompra: boolean = false;
  mensajeCompra: string = '';
  errorCompra: string = '';

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private productoService: ProductoService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = parseInt(idParam, 10);
      this.productoService.getProductoById(id).subscribe(prod => {
        this.producto = prod;
        this.cargando = false;
      });
    } else {
      this.cargando = false;
    }
  }

  volver() {
    this.location.back();
  }

  comprar() {
    if (!this.producto || !this.producto.id) return;

    this.procesandoCompra = true;
    this.mensajeCompra = '';
    this.errorCompra = '';

    this.productoService.comprarProducto(this.producto.id).subscribe({
      next: (productoComprado) => {
        this.procesandoCompra = false;
        this.producto = productoComprado;
        this.mensajeCompra = '¡Compra realizada con éxito! El producto ha sido reservado para ti.';
      },
      error: (err) => {
        this.procesandoCompra = false;
        this.errorCompra = err?.error || 'No se pudo completar la compra. Verifica tu sesión o disponibilidad.';
      }
    });
  }
}
