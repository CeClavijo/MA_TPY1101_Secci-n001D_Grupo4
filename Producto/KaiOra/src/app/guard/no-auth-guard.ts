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

    let localUserData = localStorage.getItem('user');

    return new Promise((resolve) => {

      this.firebaseSvc.getAuth().onAuthStateChanged((auth) => {

        if (!auth) {
          resolve(true);
        } else {
          if (localUserData) {
            try {
              const user = JSON.parse(localUserData);

              if (user.role === 'admin') {
                this.utilsSvc.routerLink('/admin');
              } else if (user.role === 'profesor') {
                this.utilsSvc.routerLink('/main/home');
              } else {
                this.utilsSvc.routerLink('/main'); 
              }
            } catch (e) {
              this.utilsSvc.routerLink('/main');
            }
          } else {
            this.utilsSvc.routerLink('/main');
          }
          
          resolve(false);
        }

      })

    });

  }

}