import { Routes } from '@angular/router';
import { Explorar } from './pages/explorar/explorar';
import { DetalleProducto } from './pages/detalle-producto/detalle-producto';
import { Publicar } from './pages/publicar/publicar';
import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';
import { Mensajes } from './pages/mensajes/mensajes';
import { Perfil } from './pages/perfil/perfil';
import { Admin } from './pages/admin/admin';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [

  { path: 'explorar', component: Explorar },

  { path: 'producto/nuevo', component: Publicar, canActivate: [authGuard] },
  { path: 'producto/:id', component: DetalleProducto },
  { path: 'publicar', redirectTo: 'producto/nuevo', pathMatch: 'full' },
  { path: 'admin', component: Admin, canActivate: [adminGuard] },

  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: 'mensajes', component: Mensajes, canActivate: [authGuard] },
  { path: 'perfil', component: Perfil, canActivate: [authGuard] },

  { path: '', redirectTo: 'explorar', pathMatch: 'full' },
  { path: '**', redirectTo: 'explorar' }
];
