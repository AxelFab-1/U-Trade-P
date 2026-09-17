import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Producto } from '../models/producto.model';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  // Datos falsos basados en el prototipo
  private mockProductos: Producto[] = [
    {
      id: 1,
      nombre: 'MacBook Air M1 (8GB RAM / 256GB)',
      precio: 2100,
      categoria: 'Producto',
      descripcion: 'Laptop en impecables condiciones. Batería al 89%. Incluye cargador original y estuche de regalo.',
      foto: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=500&q=80',
      condicion: 'Como nuevo',
      universidad: 'PUCP',
      rating: 4.9,
      fechaPublicacion: 'Hace 2h',
      vendedor: {
        id: 101,
        nombre: 'Carlos Curo',
        correo: 'carlos@pucp.edu.pe',
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Carlos%20Curo',
        carrera: 'Ingeniería Informática',
        universidad: 'PUCP',
        reputacion: 4.9
      }
    },
    {
      id: 2,
      nombre: 'Cargador Carga Rápida 65W USB-C',
      precio: 75,
      categoria: 'Producto',
      descripcion: 'Cargador nuevo en caja sellada.',
      foto: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&q=80',
      condicion: 'Nuevo',
      universidad: 'ULIMA',
      rating: 4.8
    },
    {
      id: 3,
      nombre: 'Mochila Antirrobo Impermeable 25L',
      precio: 95,
      categoria: 'Producto',
      descripcion: 'Usada por un ciclo, perfecta para llevar laptop.',
      foto: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80',
      condicion: 'Buen estado',
      universidad: 'UPC',
      rating: 4.5
    },
    {
      id: 4,
      nombre: 'Cold Brew Artesanal 500ml + Galleta',
      precio: 12,
      categoria: 'Comida',
      descripcion: 'Café extraído en frío por 12 horas. Delicioso.',
      foto: 'https://images.unsplash.com/photo-1517701550927-30cf4b1e5dc5?w=500&q=80',
      condicion: 'Nuevo',
      universidad: 'PUCP',
      rating: 5.0
    },
    {
      id: 5,
      nombre: 'Pack Brownies Proteicos Fudgy (x3)',
      precio: 15,
      categoria: 'Comida',
      descripcion: 'Con proteína de suero, sin azúcar añadida.',
      foto: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&q=80',
      condicion: 'Nuevo',
      universidad: 'ULIMA',
      rating: 4.9
    },
    {
      id: 6,
      nombre: 'Impresión 3D de Maquetas y Planos STL',
      precio: 25,
      categoria: 'Servicios',
      descripcion: 'Impresiones en PLA y ABS. Entrega rápida.',
      foto: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&q=80',
      condicion: 'Nuevo',
      universidad: 'PUCP / UNI',
      rating: 5.0
    },
    {
      id: 7,
      nombre: 'Asesoría en Cálculo / Física',
      precio: 35,
      categoria: 'Servicios',
      descripcion: 'Clases personalizadas para parciales.',
      foto: 'https://images.unsplash.com/photo-1633613286991-611fe299c4be?w=500&q=80',
      condicion: 'Nuevo',
      universidad: 'UNMSM / PUCP',
      rating: 4.9
    }
  ];

  constructor() { }

  // Obtener todos los productos simulados
  getProductos(): Observable<Producto[]> {
    return of(this.mockProductos);
  }

  // Obtener producto por ID simulado
  getProductoById(id: number): Observable<Producto | undefined> {
    const producto = this.mockProductos.find(p => p.id === id);
    return of(producto);
  }
}
