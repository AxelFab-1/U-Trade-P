import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Reporte, CrearReporteRequest } from '../models/reporte.model';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/reportes`;

  crearReporte(req: CrearReporteRequest): Observable<Reporte> {
    return this.http.post<Reporte>(this.apiUrl, req);
  }

  listarReportes(): Observable<Reporte[]> {
    return this.http.get<Reporte[]>(this.apiUrl);
  }

  revisarReporte(id: number): Observable<Reporte> {
    return this.http.put<Reporte>(`${this.apiUrl}/${id}/revisar`, {});
  }

  descartarReporte(id: number): Observable<Reporte> {
    return this.http.put<Reporte>(`${this.apiUrl}/${id}/descartar`, {});
  }
}
