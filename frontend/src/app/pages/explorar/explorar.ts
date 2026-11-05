import { Component, OnInit, signal, computed, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../core/services/producto.service';
import { Producto } from '../../core/models/producto.model';
import { ProductCard } from '../../components/product-card/product-card';

export interface FiltroOpcion {
  label: string;
  value: string;
  keywords: string[];
}

export const FILTROS_POR_TAB: Record<string, FiltroOpcion[]> = {
  Producto: [
    { label: 'Todas las categorías', value: 'TODAS', keywords: [] },
    { label: 'Laptops y Computación', value: 'LAPTOP', keywords: ['laptop', 'macbook', 'computadora', 'notebook', 'pc', 'teclado', 'mouse', 'pantalla'] },
    { label: 'Cargadores y Cables', value: 'CARGADOR', keywords: ['cargador', 'cable', 'usb', 'adaptador', 'power delivery', 'tipo c', 'lightning'] },
    { label: 'Mochilas y Accesorios', value: 'MOCHILA', keywords: ['mochila', 'maletín', 'maletin', 'funda', 'estuche', 'billetera'] },
    { label: 'Libros y Cuadernos', value: 'LIBROS', keywords: ['libro', 'cuaderno', 'copias', 'formulario', 'separata', 'apuntes'] },
    { label: 'Calculadoras y Útiles', value: 'UTILES', keywords: ['calculadora', 'casio', 'regla', 'escalímetro', 'escalimetro', 'lapicero'] },
    { label: 'Condición: Nuevo', value: 'NUEVO', keywords: ['nuevo', 'sellado'] },
    { label: 'Condición: Como nuevo', value: 'COMO_NUEVO', keywords: ['como nuevo', 'seminuevo', 'semi nuevo', 'impecables'] }
  ],
  Comida: [
    { label: 'Todos los alimentos', value: 'TODAS', keywords: [] },
    { label: 'Bebidas y Cafetería', value: 'BEBIDAS', keywords: ['café', 'cafe', 'cold brew', 'bebida', 'jugo', 'te', 'té', 'agua', 'refresco'] },
    { label: 'Snacks y Postres', value: 'POSTRES', keywords: ['brownie', 'galleta', 'snack', 'queque', 'torta', 'alfajor', 'muffin', 'dulce'] },
    { label: 'Desayunos y Sandwiches', value: 'DESAYUNO', keywords: ['sandwich', 'sánguche', 'pan', 'tostada', 'empanada', 'desayuno', 'croissant'] },
    { label: 'Almuerzos y Menú', value: 'ALMUERZOS', keywords: ['almuerzo', 'menú', 'menu', 'arroz', 'pollo', 'comida', 'plato'] },
    { label: 'Saludables / Fit', value: 'FIT', keywords: ['proteico', 'proteicos', 'fit', 'fitness', 'proteina', 'proteína', 'avena', 'fruta', 'ensalada', 'fudgy'] }
  ],
  Servicios: [
    { label: 'Todos los servicios', value: 'TODAS', keywords: [] },
    { label: 'Asesorías y Clases', value: 'ASESORIAS', keywords: ['asesoría', 'asesoria', 'clases', 'tutoría', 'tutoria', 'cálculo', 'calculo', 'física', 'fisica', 'matemática', 'química', 'estadística'] },
    { label: 'Impresiones 3D y Planos', value: '3D_PLANOS', keywords: ['3d', 'impresión', 'impresion', 'plano', 'autocad', 'stl', 'maqueta', 'filamento', 'pla'] },
    { label: 'Programación y Software', value: 'SOFTWARE', keywords: ['programación', 'programacion', 'software', 'código', 'codigo', 'web', 'app', 'python', 'java', 'frontend', 'backend'] },
    { label: 'Diseño Gráfico y Edición', value: 'DISENO', keywords: ['diseño', 'diseno', 'logo', 'photoshop', 'illustrator', 'edición', 'edicion', 'video', 'render'] },
    { label: 'Soporte Técnico y Reparación', value: 'SOPORTE', keywords: ['soporte', 'reparación', 'reparacion', 'mantenimiento', 'formateo', 'limpieza', 'técnico'] }
  ]
};

@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCard],
  templateUrl: './explorar.html',
  styleUrl: './explorar.scss',
})
export class Explorar implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly activeTab = signal<string>('Producto');
  readonly searchTerm = signal<string>('');
  readonly categoriaSeleccionada = signal<string>('TODAS');
  readonly todosLosProductos = signal<Producto[]>([]);
  readonly productosFiltrados = signal<Producto[]>([]);
  readonly cargando = signal<boolean>(true);

  // Lista dinámica de opciones según la pestaña activa
  readonly filtrosDisponibles = computed<FiltroOpcion[]>(() => {
    return FILTROS_POR_TAB[this.activeTab()] || FILTROS_POR_TAB['Producto'];
  });

  // Placeholder descriptivo para la barra de búsqueda
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
    this.cargarProductos();
  }

  cargarProductos() {
    this.cargando.set(true);
    this.productoService.getProductos().subscribe({
      next: (productos) => {
        this.todosLosProductos.set(productos || []);
        this.cargando.set(false);
        this.filtrarProductos();
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargando.set(false);
        this.todosLosProductos.set([]);
        this.filtrarProductos();
        this.cdr.markForCheck();
      }
    });
  }

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
    // Al cambiar de categoría principal, resetear el filtro rápido a "TODAS"
    this.categoriaSeleccionada.set('TODAS');
    this.filtrarProductos();
  }

  onSearchChange(term: string) {
    this.searchTerm.set(term);
    this.filtrarProductos();
  }

  onCategoriaChange(cat: string) {
    this.categoriaSeleccionada.set(cat);
    this.filtrarProductos();
  }

  filtrarProductos() {
    const term = this.searchTerm().trim().toLowerCase();
    const tab = this.activeTab();
    const valorFiltro = this.categoriaSeleccionada();

    const opcionesTab = this.filtrosDisponibles();
    const filtroActivo = opcionesTab.find(f => f.value === valorFiltro);

    const filtrados = this.todosLosProductos().filter(p => {
      // 0. Excluir productos vendidos / sin stock disponible (stock <= 0 o con comprador)
      const noEstaVendido = (p.stock === undefined || p.stock === null || p.stock > 0) && !p.comprador;
      if (!noEstaVendido) return false;

      // 1. Filtro de pestaña activa (Producto, Comida, Servicios)
      const coincideTab = !tab || p.categoria === tab;
      if (!coincideTab) return false;

      // 2. Filtro por término de búsqueda en nombre o descripción
      const coincideTerm = !term ||
        Boolean(p.nombre && p.nombre.toLowerCase().includes(term)) ||
        Boolean(p.descripcion && p.descripcion.toLowerCase().includes(term));
      if (!coincideTerm) return false;

      // 3. Filtro rápido de subcategoría según pestaña activa
      if (filtroActivo && filtroActivo.keywords.length > 0) {
        const match = filtroActivo.keywords.some(k => {
          const kw = k.toLowerCase();
          return (p.nombre && p.nombre.toLowerCase().includes(kw)) ||
                 (p.descripcion && p.descripcion.toLowerCase().includes(kw)) ||
                 (p.condicion && p.condicion.toLowerCase().includes(kw));
        });
        if (!match) return false;
      }

      return true;
    });

    this.productosFiltrados.set(filtrados);
    this.cdr.markForCheck();
  }

  limpiarFiltros() {
    this.searchTerm.set('');
    this.categoriaSeleccionada.set('TODAS');
    this.filtrarProductos();
  }
}
