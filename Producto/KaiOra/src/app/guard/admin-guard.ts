// admin-guard.ts
import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { Utils } from '../services/utils';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  utilsSvc = inject(Utils);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    const user = this.utilsSvc.getFromLocalStorage('user');

    if (user?.role === 'admin') {
      return true;
    }

    this.utilsSvc.routerLink('/auth');
    return false;
  }
}