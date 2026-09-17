import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductoService } from '../../core/services/producto.service';
import { Producto } from '../../core/models/producto.model';

@Component({
  selector: 'app-detalle-producto',
  imports: [CommonModule, RouterModule],
  templateUrl: './detalle-producto.html',
  styleUrl: './detalle-producto.scss',
})
export class DetalleProducto implements OnInit {
  producto: Producto | undefined;
  cargando: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private productoService: ProductoService
  ) {}

  ngOnInit() {
    // Obtener el ID de la URL
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = parseInt(idParam, 10);
      
      // Llamar al servicio para obtener los detalles
      this.productoService.getProductoById(id).subscribe(prod => {
        this.producto = prod;
        this.cargando = false;
      });
    } else {
      this.cargando = false;
    }
  }

  // Método para el botón de "Atrás"
  volver() {
    this.location.back();
  }
}
