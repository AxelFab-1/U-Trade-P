import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Producto } from '../../core/models/producto.model';
import { formatearTiempoRelativo } from '../../core/utils/tiempo-relativo.util';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss'
})
export class ProductCard {
  // Comunicación Padre -> Hijo (Requisito Semana 12)
  @Input() producto!: Producto;

  // Comunicación Hijo -> Padre vía EventEmitter (Requisito Semana 12)
  @Output() verDetalle = new EventEmitter<number>();

  get tiempoRelativo(): string {
    return formatearTiempoRelativo(this.producto?.fechaPublicacion);
  }

  onVerDetalle(): void {
    if (this.producto && this.producto.id) {
      this.verDetalle.emit(this.producto.id);
    }
  }
}
