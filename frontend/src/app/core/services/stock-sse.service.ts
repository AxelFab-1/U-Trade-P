import { Injectable, NgZone, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface StockUpdateEvent {
  productoId: number;
  stock: number;
  disponible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StockSseService {
  private readonly zone = inject(NgZone);

  conectar(productoId: number): Observable<StockUpdateEvent> {
    return new Observable<StockUpdateEvent>((observer) => {
      const url = `${environment.apiUrl}/stock/eventos/${productoId}`;
      const eventSource = new EventSource(url);

      eventSource.addEventListener('stock-update', (event: MessageEvent) => {
        try {
          const data: StockUpdateEvent = JSON.parse(event.data);
          this.zone.run(() => {
            observer.next(data);
          });
        } catch (e) {
          console.error('Error al parsear evento SSE de stock:', e);
        }
      });

      eventSource.addEventListener('conectado', (event: MessageEvent) => {
        console.log(`[SSE] Conectado al canal de stock del producto ${productoId}`);
      });

      eventSource.onerror = (error) => {
        // En caso de cierre o error de red transitorio del navegador
        console.warn(`[SSE] Error o reconexión en canal de stock para producto ${productoId}`, error);
      };

      return () => {
        console.log(`[SSE] Cerrando conexión para producto ${productoId}`);
        eventSource.close();
      };
    });
  }
}
