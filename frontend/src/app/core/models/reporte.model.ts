import { Producto } from './producto.model';
import { Usuario } from './usuario.model';

export interface Reporte {
  id: number;
  producto: Producto;
  usuarioDenunciante: Usuario;
  motivo: string;
  detalle?: string;
  fechaCreacion: string;
  estado: 'PENDIENTE' | 'REVISADO' | 'DESCARTADO';
}

export interface CrearReporteRequest {
  productoId: number;
  motivo: string;
  detalle?: string;
}
