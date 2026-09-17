import { Usuario } from './usuario.model';

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  categoria: string;
  descripcion: string;
  foto: string;
  condicion?: 'Nuevo' | 'Como nuevo' | 'Buen estado';
  universidad?: string;
  rating?: number;
  fechaPublicacion?: string;
  vendedor?: Usuario;
}
