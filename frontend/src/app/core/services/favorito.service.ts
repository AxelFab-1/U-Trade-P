import { Injectable, inject, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError, Subject } from 'rxjs';
import { Producto } from '../models/producto.model';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface ToggleFavoritoResponse {
  favorito: boolean;
  productoId: number;
  mensaje: string;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritoService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/favoritos`;

  // Set reactivo en memoria con los IDs de los productos guardados por el usuario
  readonly favoritoIds = signal<Set<number>>(new Set());
  readonly cargando = signal<boolean>(false);

  // Notificador reactivo cuando se añade o quita un favorito
  readonly favoritoCambio$ = new Subject<{ productoId: number; favorito: boolean }>();

  constructor() {
    // Sincronizar automáticamente con el estado de autenticación
    effect(() => {
      const logged = this.authService.isLoggedIn();
      if (logged) {
        this.cargarFavoritoIds();
      } else {
        this.favoritoIds.set(new Set());
      }
    });
  }

  cargarFavoritoIds(): void {
    if (!this.authService.isLoggedIn()) {
      this.favoritoIds.set(new Set());
      return;
    }

    this.cargando.set(true);
    this.http.get<number[]>(`${this.apiUrl}/ids`).subscribe({
      next: (ids) => {
        this.favoritoIds.set(new Set(ids));
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      }
    });
  }

  getProductosFavoritos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl);
  }

  esFavorito(productoId: number | undefined | null): boolean {
    if (!productoId) return false;
    return this.favoritoIds().has(productoId);
  }

  toggleFavorito(productoId: number): Observable<ToggleFavoritoResponse> {
    const estadoActual = this.esFavorito(productoId);
    const nuevoEstado = !estadoActual;

    // Actualización optimista inmediata en la UI
    const nuevoSet = new Set(this.favoritoIds());
    if (nuevoEstado) {
      nuevoSet.add(productoId);
    } else {
      nuevoSet.delete(productoId);
    }
    this.favoritoIds.set(nuevoSet);
    this.favoritoCambio$.next({ productoId, favorito: nuevoEstado });

    return this.http.post<ToggleFavoritoResponse>(`${this.apiUrl}/${productoId}/toggle`, {}).pipe(
      tap((res) => {
        // Asegurar consistencia con la respuesta del servidor
        const setConfirmado = new Set(this.favoritoIds());
        if (res.favorito) {
          setConfirmado.add(productoId);
        } else {
          setConfirmado.delete(productoId);
        }
        this.favoritoIds.set(setConfirmado);
      }),
      catchError((err) => {
        // En caso de fallo de red, revertir la UI
        const setRevertido = new Set(this.favoritoIds());
        if (estadoActual) {
          setRevertido.add(productoId);
        } else {
          setRevertido.delete(productoId);
        }
        this.favoritoIds.set(setRevertido);
        this.favoritoCambio$.next({ productoId, favorito: estadoActual });
        return throwError(() => err);
      })
    );
  }
}
