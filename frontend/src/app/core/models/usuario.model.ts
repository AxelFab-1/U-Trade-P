export interface Usuario {
  id?: number;
  nombre: string;
  correo: string;
  password?: string;
  rol?: string;
  avatar?: string;
  telefono?: string;
  campus?: string;
  carrera?: string;
  ciclo?: string;
  reputacion?: number;
  universidad?: string;
}
