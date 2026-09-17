import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Publicar } from './pages/publicar/publicar';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'publicar', component: Publicar }
];


