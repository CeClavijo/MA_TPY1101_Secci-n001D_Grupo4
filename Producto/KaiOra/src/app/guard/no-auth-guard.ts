import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { FirebaseService } from '../services/firebase.service';
import { Utils } from '../services/utils';

@Injectable({
  providedIn: 'root'
})
export class NoAuthGuard implements CanActivate {

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(Utils);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    return new Promise((resolve) => {
      const unsubscribe = this.firebaseSvc.getAuth().onAuthStateChanged((auth) => {
        unsubscribe(); // se desuscribe inmediatamente después de la primera respuesta
        
        if (!auth) {
          resolve(true);
        } else {
          const user = this.utilsSvc.getFromLocalStorage('user');

          if (user?.role === 'admin') {
            this.utilsSvc.routerLink('/admin');
          } else if (user?.role === 'profesor') {
            this.utilsSvc.routerLink('/main/home');
          } else {
            this.firebaseSvc.signOut();
            resolve(true);
            return;
          }

          resolve(false);
        }
      });
    });
  }
}