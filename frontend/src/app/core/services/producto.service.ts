import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Producto } from '../models/producto.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiUrl = `${environment.apiUrl}/productos`;

  constructor(private http: HttpClient) {}

  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl).pipe(
      catchError((error) => {
        console.error('Error al obtener productos desde la base de datos H2:', error);
        return of([]);
      })
    );
  }

  getProductoById(id: number): Observable<Producto | undefined> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error(`Error al obtener producto ${id} desde H2:`, error);
        return of(undefined);
      })
    );
  }

  getProductosPorVendedor(usuarioId: number): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/vendedor/${usuarioId}`).pipe(
      catchError((error) => {
        console.error(`Error al obtener productos del vendedor ${usuarioId}:`, error);
        return of([]);
      })
    );
  }

  crearProducto(producto: Partial<Producto>): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, producto);
  }

  comprarProducto(id: number): Observable<Producto> {
    return this.http.post<Producto>(`${this.apiUrl}/${id}/comprar`, {});
  }

  cambiarDisponibilidad(id: number, disponible?: boolean): Observable<Producto> {
    const body = disponible !== undefined ? { disponible } : {};
    return this.http.patch<Producto>(`${this.apiUrl}/${id}/disponibilidad`, body);
  }

  eliminarProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

