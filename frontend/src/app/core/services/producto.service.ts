import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto } from '../models/producto.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private readonly apiUrl = `${environment.apiUrl}/productos`;

  constructor(private readonly http: HttpClient) {}

  // 1. READ / LISTAR: Obtener todos los productos (Requisito Unidad 3 - Semana 14)
  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl);
  }

  // 2. READ / DETALLE: Obtener un producto por ID (Requisito Unidad 3 - Semana 14)
  getProductoById(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }

  // 3. CREATE / CREAR: Publicar un nuevo producto (Requisito Unidad 3 - Semana 14)
  crearProducto(producto: Partial<Producto>): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, producto);
  }

  // 4. UPDATE / ACTUALIZAR: Modificar datos de un producto (Requisito Unidad 3 - Semana 14)
  actualizarProducto(id: number, producto: Partial<Producto>): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/${id}`, producto);
  }

  // 5. DELETE / ELIMINAR: Dar de baja una publicación (Requisito Unidad 3 - Semana 14)
  eliminarProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Métodos complementarios del negocio
  getProductosPorVendedor(usuarioId: number): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/vendedor/${usuarioId}`);
  }

  cambiarDisponibilidad(id: number, disponible?: boolean): Observable<Producto> {
    const body = disponible !== undefined ? { disponible } : {};
    return this.http.patch<Producto>(`${this.apiUrl}/${id}/disponibilidad`, body);
  }

  comprarProducto(id: number): Observable<Producto> {
    return this.http.post<Producto>(`${this.apiUrl}/${id}/comprar`, {});
  }
}
