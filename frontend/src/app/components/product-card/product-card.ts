import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Producto } from '../../core/models/producto.model';
import { FavoritoService } from '../../core/services/favorito.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss'
})
export class ProductCard {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  readonly favoritoService = inject(FavoritoService);

  // Comunicación Padre -> Hijo (Requisito Semana 12)
  @Input() producto!: Producto;

  // Comunicación Hijo -> Padre vía EventEmitter (Requisito Semana 12)
  @Output() verDetalle = new EventEmitter<number>();

  get esFavorito(): boolean {
    return this.favoritoService.esFavorito(this.producto?.id);
  }

  onToggleFavorito(): void {
    if (!this.producto || !this.producto.id) return;

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.favoritoService.toggleFavorito(this.producto.id).subscribe({
      error: (err) => console.error('Error al alternar favorito:', err)
    });
  }

  onVerDetalle(): void {
    if (this.producto && this.producto.id) {
      this.verDetalle.emit(this.producto.id);
    }
  }
}
