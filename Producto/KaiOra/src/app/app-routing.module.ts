import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { NoAuthGuard } from './guard/no-auth-guard';
import { AuthGuard } from './guard/auth-guard';
import { AdminGuard } from './guard/admin-guard';
import { ProfessorGuard } from './guard/professor-guard';
import { AlumnoGuard } from './guard/alumno-guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./pages/auth/auth.module').then(m => m.AuthPageModule),
    canActivate: [NoAuthGuard]
  },
  {
    path: 'main',
    loadChildren: () => import('./pages/main/main.module').then(m => m.MainPageModule),
    canActivate: [AuthGuard, ProfessorGuard]
  },
  {
    path: 'admin',
    loadChildren: () => import('./pages/admin/admin.module').then(m => m.AdminPageModule),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'alumno',
    loadChildren: () => import('./pages/alumno/alumno.module').then(m => m.AlumnoPageModule),
    canActivate: [AuthGuard, AlumnoGuard]
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }