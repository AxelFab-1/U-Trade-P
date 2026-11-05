import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pedido, PagoYapeRequest, PagoYapeResponse } from '../models/pedido.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private readonly http = inject(HttpClient);
  private readonly pagosUrl = `${environment.apiUrl}/pagos`;
  private readonly pedidosUrl = `${environment.apiUrl}/pedidos`;

  procesarPagoYape(request: PagoYapeRequest): Observable<PagoYapeResponse> {
    return this.http.post<PagoYapeResponse>(`${this.pagosUrl}/yape`, request);
  }

  getMisCompras(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.pedidosUrl}/mis-compras`);
  }

  getMisVentas(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.pedidosUrl}/mis-ventas`);
  }
}
