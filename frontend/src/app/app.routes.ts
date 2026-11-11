import { Routes } from '@angular/router';
import { Explorar } from './pages/explorar/explorar';
import { DetalleProducto } from './pages/detalle-producto/detalle-producto';
import { Publicar } from './pages/publicar/publicar';
import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';
import { Mensajes } from './pages/mensajes/mensajes';
import { Perfil } from './pages/perfil/perfil';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Ruta principal del catálogo
  { path: 'explorar', component: Explorar },

  // ORDEN DE RUTAS (Requisito Semana 12/13):
  // La ruta literal 'producto/nuevo' DEBE declararse antes de 'producto/:id' 
  // para evitar que Angular interprete la palabra "nuevo" como un parámetro :id.
  { path: 'producto/nuevo', component: Publicar, canActivate: [authGuard] },
  { path: 'producto/:id', component: DetalleProducto },

  // Alias compatible para navegación directa a publicar
  { path: 'publicar', redirectTo: 'producto/nuevo', pathMatch: 'full' },

  // Autenticación y perfil
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: 'mensajes', component: Mensajes, canActivate: [authGuard] },
  { path: 'perfil', component: Perfil, canActivate: [authGuard] },

  // Redirección por defecto
  { path: '', redirectTo: 'explorar', pathMatch: 'full' },
  { path: '**', redirectTo: 'explorar' }
];
