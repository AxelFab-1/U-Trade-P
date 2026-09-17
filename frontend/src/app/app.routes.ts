import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'explorar',
    loadComponent: () => import('./pages/explorar/explorar').then(m => m.Explorar)
  },
  {
    path: 'producto/:id',
    loadComponent: () => import('./pages/detalle-producto/detalle-producto').then(m => m.DetalleProducto)
  },
  {
    path: '',
    redirectTo: 'explorar',
    pathMatch: 'full'
  }
];
