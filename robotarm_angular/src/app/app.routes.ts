import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '',        loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'login',   loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'signup',  loadComponent: () => import('./pages/signup/signup.component').then(m => m.SignupComponent) },
  { path: 'dashboard', canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'vision', canActivate: [authGuard],
    loadComponent: () => import('./pages/vision/vision-inspection.component').then(m => m.VisionInspectionComponent) },
  { path: '**', redirectTo: '' }
];
