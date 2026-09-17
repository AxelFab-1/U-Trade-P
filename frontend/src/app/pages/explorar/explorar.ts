import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductoService } from '../../core/services/producto.service';
import { Producto } from '../../core/models/producto.model';
import { ProductCard } from '../../components/product-card/product-card';

@Component({
  selector: 'app-explorar',
  imports: [CommonModule, ProductCard],
  templateUrl: './explorar.html',
  styleUrl: './explorar.scss',
})
export class Explorar implements OnInit {
  activeTab: string = 'Producto';
  todosLosProductos: Producto[] = [];
  productosFiltrados: Producto[] = [];

  constructor(private productoService: ProductoService) {}

  ngOnInit() {
    this.productoService.getProductos().subscribe(productos => {
      this.todosLosProductos = productos;
      this.filtrarProductos();
    });
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.filtrarProductos();
  }

  filtrarProductos() {
    this.productosFiltrados = this.todosLosProductos.filter(
      p => p.categoria === this.activeTab
    );
  }
}
