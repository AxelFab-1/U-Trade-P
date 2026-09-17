import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MensajeItem {
  id: number;
  nombre: string;
  carrera: string;
  avatar: string;
  productoRelacionado: string;
  ultimoMensaje: string;
  tiempo: string;
  noLeidos: number;
  telefono: string;
}

@Component({
  selector: 'app-mensajes',
  imports: [CommonModule],
  templateUrl: './mensajes.html',
  styleUrl: './mensajes.scss',
})
export class Mensajes {
  readonly conversaciones = signal<MensajeItem[]>([
    {
      id: 1,
      nombre: 'Johan Chalán',
      carrera: 'Ing. de Sistemas',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Johan',
      productoRelacionado: 'Laptop HP i5',
      ultimoMensaje: '¡Hola! ¿Aún sigue disponible la laptop? Puedo recogerla en campus Lima Centro.',
      tiempo: '10:45 AM',
      noLeidos: 2,
      telefono: '51987654321'
    },
    {
      id: 2,
      nombre: 'Camila Torres',
      carrera: 'Ing. Industrial',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Camila',
      productoRelacionado: 'Grabado láser',
      ultimoMensaje: '¿Hacen grabados personalizados para placas de madera para mañana?',
      tiempo: 'Ayer',
      noLeidos: 0,
      telefono: '51981234567'
    },
    {
      id: 3,
      nombre: 'José Agurto',
      carrera: 'Ing. de Software',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jose',
      productoRelacionado: 'Código Fuente - Proyecto',
      ultimoMensaje: 'Te envié los requerimientos al WhatsApp para coordinar la entrega.',
      tiempo: 'Hace 2 días',
      noLeidos: 0,
      telefono: '51976543210'
    }
  ]);
}
