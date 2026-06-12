import { inject, Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { Utils } from '../services/utils';

@Injectable({
  providedIn: 'root'
})
export class ProfessorGuard implements CanActivate {

  utilsSvc = inject(Utils);

  canActivate(): boolean {
    const user = this.utilsSvc.getFromLocalStorage('user');

    if (user?.role === 'profesor') {
      return true;
    }

    this.utilsSvc.routerLink('/auth');
    return false;
  }
}