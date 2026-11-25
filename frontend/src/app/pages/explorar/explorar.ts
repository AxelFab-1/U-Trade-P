import { Component, OnInit, OnDestroy, signal, computed, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { ProductoService } from '../../core/services/producto.service';
import { Producto } from '../../core/models/producto.model';
import { ProductCard } from '../../components/product-card/product-card';

export type TipoOrden = 'recientes' | 'precio_asc' | 'precio_desc';

@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCard],
  templateUrl: './explorar.html',
  styleUrl: './explorar.scss',
})
export class Explorar implements OnInit, OnDestroy {
  private readonly productoService = inject(ProductoService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly activeTab = signal<string>('Producto');
  readonly searchTerm = signal<string>('');
  readonly ordenSeleccionado = signal<TipoOrden>('recientes');
  readonly productosFiltrados = signal<Producto[]>([]);
  readonly cargando = signal<boolean>(true);

  // Lista ordenada de productos sin mutar el array original
  readonly productosOrdenados = computed<Producto[]>(() => {
    const lista = [...this.productosFiltrados()];
    const orden = this.ordenSeleccionado();

    switch (orden) {
      case 'precio_asc':
        return lista.sort((a, b) => (a.precio ?? 0) - (b.precio ?? 0));
      case 'precio_desc':
        return lista.sort((a, b) => (b.precio ?? 0) - (a.precio ?? 0));
      case 'recientes':
      default:
        return lista.sort((a, b) => {
          const fechaA = a.fechaPublicacion ? new Date(a.fechaPublicacion).getTime() : 0;
          const fechaB = b.fechaPublicacion ? new Date(b.fechaPublicacion).getTime() : 0;
          if (fechaB !== fechaA) {
            return fechaB - fechaA;
          }
          return (b.id ?? 0) - (a.id ?? 0);
        });
    }
  });

  // Stream reactivo de búsqueda en tiempo real (termino + pestaña)
  private readonly searchSubject = new Subject<{ term: string; tab: string }>();
  private searchSub?: Subscription;

  // Placeholder descriptivo dinámico según la pestaña activa
  readonly placeholderBusqueda = computed<string>(() => {
    switch (this.activeTab()) {
      case 'Comida':
        return 'Buscar café, postres, galletas, snacks o almuerzos...';
      case 'Servicios':
        return 'Buscar asesorías, cálculo, impresiones 3D, soporte...';
      default:
        return 'Buscar laptops, cargadores, mochilas, libros...';
    }
  });

  ngOnInit() {
    this.searchSub = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged((prev, curr) => prev.term === curr.term && prev.tab === curr.tab),
      switchMap(({ term, tab }) => {
        this.cargando.set(true);
        this.cdr.markForCheck();
        return this.productoService.buscarProductos(term, tab).pipe(
          catchError(() => of([]))
        );
      })
    ).subscribe({
      next: (productos) => {
        this.productosFiltrados.set(productos || []);
        this.cargando.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.productosFiltrados.set([]);
        this.cargando.set(false);
        this.cdr.markForCheck();
      }
    });

    // Carga inicial al ingresar a la pantalla
    this.searchSubject.next({ term: '', tab: this.activeTab() });
  }

  ngOnDestroy() {
    this.searchSub?.unsubscribe();
  }

  // Navegación a detalle de publicación
  irADetalle(id: number): void {
    this.router.navigate(['/producto', id]);
  }

  // Cambio de pestaña superior (Productos | Comida | Servicios)
  setActiveTab(tab: string) {
    this.activeTab.set(tab);
    this.searchTerm.set('');
    this.searchSubject.next({ term: '', tab });
  }

  // Entrada de texto en tiempo real con debounce
  onSearchChange(term: string) {
    this.searchTerm.set(term);
    this.searchSubject.next({ term, tab: this.activeTab() });
  }

  // Cambio de criterio de ordenamiento
  onOrdenChange(orden: TipoOrden) {
    this.ordenSeleccionado.set(orden);
  }

  // Restablecer búsqueda
  limpiarFiltros() {
    this.searchTerm.set('');
    this.searchSubject.next({ term: '', tab: this.activeTab() });
  }
}
