import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Publicar } from './pages/publicar/publicar';
import { Mensajes } from './pages/mensajes/mensajes';
import { Perfil } from './pages/perfil/perfil';

export const routes: Routes = [
  {
    path: 'explorar',
    loadComponent: () => import('./pages/explorar/explorar').then(m => m.Explorar)
  },
  {
    path: 'producto/:id',
    loadComponent: () => import('./pages/detalle-producto/detalle-producto').then(m => m.DetalleProducto)
  },
  { path: 'login', component: Login },
  { path: 'publicar', component: Publicar },
  { path: 'mensajes', component: Mensajes },
  { path: 'perfil', component: Perfil },
  {
    path: '',
    redirectTo: 'explorar',
    pathMatch: 'full'
  }
];
