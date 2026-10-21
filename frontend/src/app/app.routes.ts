import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';
import { Publicar } from './pages/publicar/publicar';
import { Mensajes } from './pages/mensajes/mensajes';
import { Perfil } from './pages/perfil/perfil';
import { authGuard } from './core/guards/auth.guard';

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
  { path: 'registro', component: Registro },
  { path: 'publicar', component: Publicar, canActivate: [authGuard] },
  { path: 'mensajes', component: Mensajes, canActivate: [authGuard] },
  { path: 'perfil', component: Perfil, canActivate: [authGuard] },
  {
    path: '',
    redirectTo: 'explorar',
    pathMatch: 'full'
  }
];
