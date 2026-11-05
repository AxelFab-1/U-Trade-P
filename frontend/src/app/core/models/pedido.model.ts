import { Producto } from './producto.model';
import { Usuario } from './usuario.model';

export interface Pedido {
  id: number;
  producto: Producto;
  comprador: Usuario;
  vendedor?: Usuario;
  cantidad: number;
  montoTotal: number;
  metodoPago: string;
  celularComprador: string;
  numeroTransaccion: string;
  estado: string;
  fecha: string;
}

export interface PagoYapeRequest {
  productoId: number;
  cantidad: number;
  celular: string;
  codigoAprobacion: string;
}

export interface PagoYapeResponse {
  exitoso: boolean;
  mensaje: string;
  numeroTransaccion: string;
  pedidoId: number;
  montoTotal: number;
  cantidad: number;
  nombreProducto: string;
  fecha: string;
}
