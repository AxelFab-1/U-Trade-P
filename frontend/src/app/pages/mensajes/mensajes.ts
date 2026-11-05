import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-mensajes',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mensajes.html',
  styleUrl: './mensajes.scss',
})
export class Mensajes {
  readonly conversaciones = signal<any[]>([]);
}
